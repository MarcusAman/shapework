async function test() {
  try {
    const resMode = await fetch('http://localhost:3000/api/mode');
    console.log('/api/mode response:', await resMode.json());

    const resConfig = await fetch('http://localhost:3000/api/demo/config');
    console.log('/api/demo/config response:', await resConfig.json());
  } catch (e) {
    console.error('Error fetching endpoints:', e);
  }
}

test();
