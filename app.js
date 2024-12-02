let tg = window.Telegram.WebApp;
tg.expand();

// Initialize theme
document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor);
document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor);

const API_BASE_URL = 'http://localhost:8000/api';

function clearInput() {
    document.getElementById('videoUrl').value = '';
    document.getElementById('videoInfo').classList.add('hidden');
    document.getElementById('errorMessage').classList.add('hidden');
}

function showLoading() {
    document.getElementById('loadingIndicator').classList.remove('hidden');
    document.getElementById('videoInfo').classList.add('hidden');
    document.getElementById('errorMessage').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingIndicator').classList.add('hidden');
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    hideLoading();
}

function formatDuration(seconds) {
    if (!seconds) return 'Длительность неизвестна';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatFileSize(mb) {
    if (!mb) return 'Размер неизвестен';
    return mb < 1024 ? `${mb.toFixed(1)} МБ` : `${(mb/1024).toFixed(1)} ГБ`;
}

async function getVideoInfo() {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    if (!videoUrl) {
        showError('Пожалуйста, введите ссылку на видео');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/get-video-info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: videoUrl })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Не удалось получить информацию о видео');
        }

        const data = await response.json();
        displayVideoInfo(data);
    } catch (error) {
        showError(error.message);
    }
}

function displayVideoInfo(data) {
    document.getElementById('thumbnail').src = data.thumbnail;
    document.getElementById('videoTitle').textContent = data.title;
    document.getElementById('videoDuration').textContent = `Длительность: ${formatDuration(data.duration)}`;
    document.getElementById('videoPlatform').textContent = `Платформа: ${data.platform}`;

    const formatsList = document.getElementById('formatsList');
    formatsList.innerHTML = '';

    data.formats.forEach(format => {
        const formatDiv = document.createElement('div');
        formatDiv.className = 'format-option bg-white dark:bg-gray-700 p-4 rounded-lg shadow hover:shadow-md transition-shadow';
        
        formatDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <span class="font-medium dark:text-white">${format.resolution}</span>
                    <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">${format.ext}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500 dark:text-gray-400">${formatFileSize(format.filesize_mb)}</span>
                    <button onclick="downloadVideo('${data.platform}', '${format.format_id}')" 
                            class="download-button">
                        Скачать
                    </button>
                </div>
            </div>
        `;
        
        formatsList.appendChild(formatDiv);
    });

    document.getElementById('videoInfo').classList.remove('hidden');
    hideLoading();
}

async function downloadVideo(platform, formatId) {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    
    try {
        const response = await fetch(`${API_BASE_URL}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                url: videoUrl,
                format_id: formatId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to download video');
        }

        const data = await response.json();
        
        // Create temporary link and trigger download
        const a = document.createElement('a');
        a.href = data.download_url;
        a.download = `${data.title}.${data.ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        tg.showAlert('Загрузка началась! Видео будет сохранено в папку загрузок.');
    } catch (error) {
        showError(error.message);
    }
}
