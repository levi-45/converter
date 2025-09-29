document.getElementById('convertBtn').addEventListener('click', convertPlaylist);
document.getElementById('clearBtn').addEventListener('click', clearFields);
document.getElementById('downloadBtn').addEventListener('click', downloadPlaylist);
document.getElementById('downloadBouquetBtn').addEventListener('click', downloadBouquet);

function convertPlaylist() {
    const input = document.getElementById('inputPlaylist').value.trim();
    if (!input) {
        alert('Please paste your M3U playlist first');
        return;
    }
    
    const conversionType = document.querySelector('input[name="conversion"]:checked').value;
    let output = '';
    let infoText = '';
    
    if (conversionType === 'extract') {
        // Extract only URLs
        const lines = input.split('\n');
        for (const line of lines) {
            if (line.startsWith('http')) {
                output += line + '\n';
            }
        }
        infoText = 'Extracted plain URLs from the playlist.';
    } else if (conversionType === 'simple') {
        // Convert to simple M3U format
        const lines = input.split('\n');
        let channelName = '';
        
        for (const line of lines) {
            if (line.startsWith('#EXTINF')) {
                // Extract channel name
                const nameMatch = line.match(/,(.*)$/);
                if (nameMatch && nameMatch[1]) {
                    channelName = nameMatch[1].trim();
                }
            } else if (line.startsWith('http')) {
                output += `#EXTINF:-1,${channelName}\n${line}\n`;
                channelName = '';
            }
        }
        infoText = 'Converted to simple M3U format with basic channel info.';
    } else if (conversionType === 'extended') {
        // Convert to extended M3U format (with more metadata)
        const lines = input.split('\n');
        let channelName = '';
        let tvgId = '';
        let tvgLogo = '';
        let groupTitle = '';
        
        for (const line of lines) {
            if (line.startsWith('#EXTINF')) {
                // Parse existing EXTINF line
                channelName = line.split(',').pop().trim();
                
                // Extract additional attributes if they exist
                const attrMatch = line.match(/tvg-id="([^"]*)"/);
                tvgId = attrMatch ? attrMatch[1] : '';
                
                const logoMatch = line.match(/tvg-logo="([^"]*)"/);
                tvgLogo = logoMatch ? logoMatch[1] : '';
                
                const groupMatch = line.match(/group-title="([^"]*)"/);
                groupTitle = groupMatch ? groupMatch[1] : '';
            } else if (line.startsWith('http')) {
                // Build new EXTINF line with all attributes
                let extinfLine = '#EXTINF:-1';
                if (tvgId) extinfLine += ` tvg-id="${tvgId}"`;
                if (tvgLogo) extinfLine += ` tvg-logo="${tvgLogo}"`;
                if (groupTitle) extinfLine += ` group-title="${groupTitle}"`;
                extinfLine += `,${channelName}`;
                
                output += `${extinfLine}\n${line}\n`;
                
                // Reset for next channel
                channelName = '';
                tvgId = '';
                tvgLogo = '';
                groupTitle = '';
            }
        }
        infoText = 'Converted to extended M3U format with TVG-ID, logo and group info.';
    } else if (conversionType === 'enigma2') {
        // Convert to Enigma2 userbouquet format
        const lines = input.split('\n');
        let channelName = '';
        
        output = `#NAME Levi45 ( IPTV )\n`;
        
        for (const line of lines) {
            if (line.startsWith('#EXTINF')) {
                // Extract channel name
                const nameMatch = line.match(/,(.*)$/);
                if (nameMatch && nameMatch[1]) {
                    channelName = nameMatch[1].trim();
                }
            } else if (line.startsWith('http')) {
                // Convert URL to Enigma2 service format
                const serviceType = line.includes('m3u8') ? '4097' : '1';
                const encodedUrl = encodeURI(line).replace(/:/g, '%3a');
                output += `#SERVICE ${serviceType}:0:1:0:0:0:0:0:0:0:${encodedUrl}:${channelName}\n`;
                output += `#DESCRIPTION ${channelName}\n`;
                
                channelName = '';
            }
        }
        infoText = 'Converted to Enigma2 userbouquet format for Dreambox/VU+ receivers.';
    }
    
    document.getElementById('outputPlaylist').value = output.trim();
    document.getElementById('downloadBtn').disabled = !output.trim();
    document.getElementById('downloadBouquetBtn').disabled = conversionType !== 'enigma2';
    document.getElementById('conversionInfo').textContent = infoText;
}

function clearFields() {
    document.getElementById('inputPlaylist').value = '';
    document.getElementById('outputPlaylist').value = '';
    document.getElementById('downloadBtn').disabled = true;
    document.getElementById('downloadBouquetBtn').disabled = true;
    document.getElementById('conversionInfo').textContent = '';
}

function downloadPlaylist() {
    const content = document.getElementById('outputPlaylist').value;
    if (!content) return;
    
    const blob = new Blob([content], { type: 'application/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'levi45_converted_playlist.m3u';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

function downloadBouquet() {
    const content = document.getElementById('outputPlaylist').value;
    if (!content) return;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'userbouquet.levi45_iptv.tv';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}