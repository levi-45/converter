// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get all elements
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadBouquetBtn = document.getElementById('downloadBouquetBtn');
    const inputPlaylist = document.getElementById('inputPlaylist');
    const outputPlaylist = document.getElementById('outputPlaylist');
    const conversionInfo = document.getElementById('conversionInfo');
    
    // Add event listeners
    convertBtn.addEventListener('click', convertPlaylist);
    clearBtn.addEventListener('click', clearFields);
    downloadBtn.addEventListener('click', downloadPlaylist);
    downloadBouquetBtn.addEventListener('click', downloadBouquet);
    
    // Enable convert button when there's input
    inputPlaylist.addEventListener('input', function() {
        convertBtn.disabled = !this.value.trim();
    });
});

function convertPlaylist() {
    const input = document.getElementById('inputPlaylist').value.trim();
    if (!input) {
        alert('Please paste your M3U playlist first');
        return;
    }
    
    const conversionType = document.querySelector('input[name="conversion"]:checked').value;
    let output = '';
    let infoText = '';
    
    try {
        if (conversionType === 'extract') {
            // Extract only URLs
            const lines = input.split('\n');
            let urlCount = 0;
            
            for (const line of lines) {
                if (line.startsWith('http')) {
                    output += line + '\n';
                    urlCount++;
                }
            }
            infoText = `Extracted ${urlCount} URLs from the playlist.`;
            
        } else if (conversionType === 'simple') {
            // Convert to simple M3U format
            const lines = input.split('\n');
            let channelName = '';
            let channelCount = 0;
            
            output = '#EXTM3U\n';
            
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
                    channelCount++;
                }
            }
            infoText = `Converted ${channelCount} channels to simple M3U format.`;
            
        } else if (conversionType === 'extended') {
            // Convert to extended M3U format (with more metadata)
            const lines = input.split('\n');
            let channelName = '';
            let tvgId = '';
            let tvgLogo = '';
            let groupTitle = '';
            let channelCount = 0;
            
            output = '#EXTM3U\n';
            
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
                    channelCount++;
                    
                    // Reset for next channel
                    channelName = '';
                    tvgId = '';
                    tvgLogo = '';
                    groupTitle = '';
                }
            }
            infoText = `Converted ${channelCount} channels to extended M3U format with TVG metadata.`;
            
        } else if (conversionType === 'enigma2') {
            // Convert to Enigma2 userbouquet format
            const lines = input.split('\n');
            let channelName = '';
            let channelCount = 0;
            
            output = `#NAME Levi45 IPTV Playlist\n#SERVICE 1:64:0:0:0:0:0:0:0:0:\n#DESCRIPTION Levi45 IPTV Playlist\n`;
            
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
                    channelCount++;
                    
                    channelName = '';
                }
            }
            infoText = `Converted ${channelCount} channels to Enigma2 userbouquet format for Dreambox/VU+ receivers.`;
        }
        
        // Update the output and UI
        document.getElementById('outputPlaylist').value = output.trim();
        document.getElementById('downloadBtn').disabled = !output.trim();
        document.getElementById('downloadBouquetBtn').disabled = conversionType !== 'enigma2';
        document.getElementById('conversionInfo').textContent = infoText;
        
    } catch (error) {
        console.error('Conversion error:', error);
        alert('Error converting playlist. Please check the format and try again.');
        document.getElementById('conversionInfo').textContent = 'Error: Invalid playlist format';
    }
}

function clearFields() {
    document.getElementById('inputPlaylist').value = '';
    document.getElementById('outputPlaylist').value = '';
    document.getElementById('downloadBtn').disabled = true;
    document.getElementById('downloadBouquetBtn').disabled = true;
    document.getElementById('conversionInfo').textContent = '';
    document.getElementById('convertBtn').disabled = true;
}

function downloadPlaylist() {
    const content = document.getElementById('outputPlaylist').value;
    if (!content) return;
    
    const conversionType = document.querySelector('input[name="conversion"]:checked').value;
    let filename = 'levi45_converted_playlist.m3u';
    
    if (conversionType === 'extract') {
        filename = 'levi45_extracted_urls.txt';
    }
    
    const blob = new Blob([content], { type: 'application/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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