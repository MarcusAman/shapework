/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GoogleMapWidgetProps {
  address: string;
  height?: string;
}

export default function GoogleMapWidget({ address, height = '150px' }: GoogleMapWidgetProps) {
  if (!address) return null;
  
  // If address does not specify city/state, append ", Austin, TX" to localize it
  let searchAddress = address;
  const lowerAddr = address.toLowerCase();
  if (!lowerAddr.includes('austin') && !lowerAddr.includes('tx') && !lowerAddr.includes('texas')) {
    searchAddress = `${address}, Austin, TX`;
  }
  
  // Standard free interactive Google Maps embed URL
  const encodedAddress = encodeURIComponent(searchAddress);
  const embedUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  
  return (
    <div className="w-full border border-border-strong overflow-hidden bg-secondary-surface mt-2 shadow-sm">
      <iframe
        title={`Google Map for ${address}`}
        width="100%"
        height={height}
        style={{ border: 0, filter: 'contrast(1.05)' }}
        src={embedUrl}
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
