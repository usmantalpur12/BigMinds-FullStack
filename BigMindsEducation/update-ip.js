const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('🔍 Detecting your laptop\'s active local IP address...');

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ipList = [];

  for (const interfaceName in interfaces) {
    // Skip virtual adapters commonly created by WSL, VMware, VirtualBox, etc.
    const nameLower = interfaceName.toLowerCase();
    if (
      nameLower.includes('virtual') ||
      nameLower.includes('vbox') ||
      nameLower.includes('vmware') ||
      nameLower.includes('wsl') ||
      nameLower.includes('loopback') ||
      nameLower.includes('pseudo') ||
      nameLower.includes('host-only')
    ) {
      continue;
    }

    for (const iface of interfaces[interfaceName]) {
      // Prioritize IPv4 and non-internal addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ipList.push({
          name: interfaceName,
          ip: iface.address
        });
      }
    }
  }

  // If no IPs found after filtering, try searching all interfaces (excluding loopback)
  if (ipList.length === 0) {
    for (const interfaceName in interfaces) {
      for (const iface of interfaces[interfaceName]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ipList.push({
            name: interfaceName,
            ip: iface.address
          });
        }
      }
    }
  }

  return ipList;
}

const ips = getLocalIPs();

if (ips.length === 0) {
  console.error('❌ Could not find any active local IPv4 address. Are you connected to Wi-Fi or Ethernet?');
  process.exit(1);
}

// Select the first active physical IP found (usually Wi-Fi or Ethernet)
const selected = ips[0];
console.log(`\n✅ Detected local IP: ${selected.ip} (Interface: ${selected.name})`);

if (ips.length > 1) {
  console.log('\nOther detected interfaces:');
  ips.slice(1).forEach(item => {
    console.log(` - ${item.name}: ${item.ip}`);
  });
  console.log(`\nUsing "${selected.ip}" as it is the primary physical network adapter.`);
}

// Files to update
const filesToUpdate = [
  {
    name: '.env',
    path: path.join(__dirname, '.env'),
    regex: /EXPO_PACKAGER_HOSTNAME=.*/g,
    replacement: `EXPO_PACKAGER_HOSTNAME=${selected.ip}`
  },
  {
    name: 'app/services/api.ts',
    path: path.join(__dirname, 'app/services/api.ts'),
    regex: /const LOCAL_IP = ['"].*['"];/g,
    replacement: `const LOCAL_IP = '${selected.ip}';`
  },
  {
    name: 'test-connection.js',
    path: path.join(__dirname, 'test-connection.js'),
    regex: /const IP_ADDRESS = ['"].*['"];/g,
    replacement: `const IP_ADDRESS = '${selected.ip}';`
  }
];

console.log('\n📝 Updating files...');

filesToUpdate.forEach(file => {
  if (fs.existsSync(file.path)) {
    try {
      let content = fs.readFileSync(file.path, 'utf8');
      if (content.match(file.regex)) {
        content = content.replace(file.regex, file.replacement);
        fs.writeFileSync(file.path, content, 'utf8');
        console.log(`   ✅ Updated ${file.name}`);
      } else {
        console.log(`   ⚠️  Found ${file.name} but could not find the IP variable pattern to replace.`);
      }
    } catch (err) {
      console.error(`   ❌ Error updating ${file.name}:`, err.message);
    }
  } else {
    console.log(`   ℹ️  Skipped ${file.name} (file does not exist)`);
  }
});

console.log('\n🚀 Done! You can now start your server and connect. Good luck!');
