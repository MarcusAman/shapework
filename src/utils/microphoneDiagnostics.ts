export interface BrowserEnvironmentInfo {
  isSecureContext: boolean;
  isTopLevel: boolean;
  currentOrigin: string;
  mediaDevicesAvailable: boolean;
  getUserMediaAvailable: boolean;
  permissionsPolicyAllowed: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
  documentVisibility: string;
  documentHasFocus: boolean;
}

export interface AudioInputDevice {
  deviceId: string;
  label: string;
  isDefault: boolean;
}

export interface DetailedAudioError {
  name: string;
  message: string;
  constraint?: string;
  constructorName?: string;
  stack?: string;
  friendlyMessage: string;
}

export interface TrackDiagnosticInfo {
  label: string;
  readyState: string;
  enabled: boolean;
  muted: boolean;
  settings: MediaTrackSettings;
}

export interface LiveLevelResult {
  hasTrack: boolean;
  trackInfo?: TrackDiagnosticInfo;
  peakLevel: number; // 0 to 100
  isLive: boolean;
}

export function detectBrowserEnvironment(): BrowserEnvironmentInfo {
  const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false;
  const isTopLevel = typeof window !== 'undefined' ? window.top === window.self : true;
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const mediaDevicesAvailable = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices);
  const getUserMediaAvailable = mediaDevicesAvailable && typeof navigator.mediaDevices.getUserMedia === 'function';

  let permissionsPolicyAllowed = true;
  try {
    if (typeof document !== 'undefined' && (document as any).permissionsPolicy?.allowsFeature) {
      permissionsPolicyAllowed = (document as any).permissionsPolicy.allowsFeature('microphone');
    }
  } catch (e) {
    permissionsPolicyAllowed = true;
  }

  return {
    isSecureContext,
    isTopLevel,
    currentOrigin,
    mediaDevicesAvailable,
    getUserMediaAvailable,
    permissionsPolicyAllowed,
    permissionState: 'unknown',
    documentVisibility: typeof document !== 'undefined' ? document.visibilityState : 'visible',
    documentHasFocus: typeof document !== 'undefined' ? document.hasFocus() : true
  };
}

export async function queryMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unknown';
  }
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return status.state as 'granted' | 'denied' | 'prompt';
  } catch (e) {
    return 'unknown';
  }
}

export async function enumerateAudioInputs(): Promise<AudioInputDevice[]> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((d) => d.kind === 'audioinput');
    return audioInputs.map((d, index) => ({
      deviceId: d.deviceId,
      label: d.label || `Microphone ${index + 1} (${d.deviceId.slice(0, 8)})`,
      isDefault: d.deviceId === 'default' || index === 0
    }));
  } catch (e) {
    return [];
  }
}

export function parseAudioError(err: any): DetailedAudioError {
  const name = err?.name || err?.constructor?.name || 'UnknownError';
  const message = err?.message || String(err);
  const constraint = err?.constraint;
  const stack = err?.stack;

  let friendlyMessage = 'We couldn’t start the voice session. Please try again.';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    friendlyMessage = 'Chrome or macOS is blocking microphone access. Open microphone settings and try again.';
  } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    friendlyMessage = 'We couldn’t find a microphone. Connect or choose a microphone, then try again.';
  } else if (name === 'NotReadableError' || name === 'TrackStartError') {
    friendlyMessage = 'Another app may be using your microphone. Close other recording or meeting apps and try again.';
  } else if (name === 'OverconstrainedError') {
    friendlyMessage = 'The selected microphone is no longer available. Choose another microphone.';
  } else if (name === 'IframeBlocked') {
    friendlyMessage = 'Voice cannot start inside this preview. Open Shapework in a new browser tab.';
  } else if (name === 'ZeroAudioLevel') {
    friendlyMessage = 'Your microphone is connected, but we cannot hear any sound. Check the selected microphone and input level.';
  }

  return {
    name,
    message,
    constraint,
    constructorName: err?.constructor?.name,
    stack,
    friendlyMessage
  };
}

export async function testRawMicrophoneLevel(
  deviceId?: string,
  durationMs: number = 1000
): Promise<LiveLevelResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { hasTrack: false, peakLevel: 0, isLive: false };
  }

  const constraints: MediaStreamConstraints = {
    audio: deviceId ? { deviceId: { exact: deviceId } } : true
  };

  let stream: MediaStream | null = null;
  let audioCtx: AudioContext | null = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    const [track] = stream.getAudioTracks();

    if (!track) {
      return { hasTrack: false, peakLevel: 0, isLive: false };
    }

    const trackInfo: TrackDiagnosticInfo = {
      label: track.label,
      readyState: track.readyState,
      enabled: track.enabled,
      muted: track.muted,
      settings: track.getSettings()
    };

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioCtxClass();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let peak = 0;
    const startTime = Date.now();

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const level = Math.min(100, Math.round((avg / 255) * 100 * 2.5));
        if (level > peak) peak = level;

        if (Date.now() - startTime >= durationMs) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    return {
      hasTrack: true,
      trackInfo,
      peakLevel: peak,
      isLive: track.readyState === 'live'
    };
  } finally {
    if (audioCtx) {
      await audioCtx.close().catch(() => {});
    }
    if (stream) {
      for (const t of stream.getTracks()) {
        t.stop();
      }
    }
  }
}
