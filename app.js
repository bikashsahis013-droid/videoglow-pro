document.addEventListener('DOMContentLoaded', () => {
    const videoInput = document.getElementById('videoInput');
    const sourceVideo = document.getElementById('sourceVideo');
    const emptyPreview = document.getElementById('emptyPreview');
    const fileNameDiv = document.getElementById('fileName');
    const exportBtn = document.getElementById('exportBtn');
    const downloadLink = document.getElementById('downloadLink');
    const statusDiv = document.getElementById('status');

    const filterButtons = document.querySelectorAll('.filter');
    const brightnessSlider = document.getElementById('brightness');
    const contrastSlider = document.getElementById('contrast');
    const saturationSlider = document.getElementById('saturation');
    
    const brightnessVal = document.getElementById('brightnessValue');
    const contrastVal = document.getElementById('contrastValue');
    const saturationVal = document.getElementById('saturationValue');

    let currentFilter = 'original';

    // 1. Load Video
    videoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const videoURL = URL.createObjectURL(file);
            sourceVideo.src = videoURL;
            sourceVideo.style.display = 'block';
            emptyPreview.style.display = 'none';
            fileNameDiv.textContent = file.name;
            
            exportBtn.classList.remove('disabled');
            exportBtn.removeAttribute('disabled');
            downloadLink.classList.add('hidden');
            statusDiv.textContent = 'Video loaded! Select filters and click Export to save.';
        }
    });

    // 2. Filter Buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.getAttribute('data-filter');
            applyVideoStyles();
        });
    });

    function getFilterCSSString() {
        let filterString = '';
        switch (currentFilter) {
            case 'natural': 
                filterString = 'contrast(125%) saturate(130%) brightness(105%)'; 
                break;
            case 'cinematic': 
                filterString = 'contrast(140%) brightness(95%) sepia(20%) saturate(135%)'; 
                break;
            case 'vivid': 
                filterString = 'saturate(200%) contrast(135%) brightness(110%)'; 
                break;
            case 'vintage': 
                filterString = 'sepia(60%) contrast(115%) brightness(95%)'; 
                break;
            case 'mono': 
                filterString = 'grayscale(100%) contrast(130%)'; 
                break;
            default: 
                filterString = 'contrast(115%) saturate(110%) brightness(102%)'; 
                break;
        }

        const bright = brightnessSlider ? brightnessSlider.value : 100;
        const contrast = contrastSlider ? contrastSlider.value : 100;
        const saturation = saturationSlider ? saturationSlider.value : 100;

        return `${filterString} brightness(${bright}%) contrast(${contrast}%) saturate(${saturation}%)`;
    }

    function applyVideoStyles() {
        sourceVideo.style.filter = getFilterCSSString();
    }

    if (brightnessSlider) brightnessSlider.addEventListener('input', (e) => { brightnessVal.textContent = e.target.value + '%'; applyVideoStyles(); });
    if (contrastSlider) contrastSlider.addEventListener('input', (e) => { contrastVal.textContent = e.target.value + '%'; applyVideoStyles(); });
    if (saturationSlider) saturationSlider.addEventListener('input', (e) => { saturationVal.textContent = e.target.value + '%'; applyVideoStyles(); });

    // 3. ADVANCED CANVAS RENDERING & EXPORT
    exportBtn.addEventListener('click', async () => {
        if (exportBtn.classList.contains('disabled')) return;

        statusDiv.textContent = 'Processing video frames with filters... Please wait.';
        exportBtn.disabled = true;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = sourceVideo.videoWidth || 1280;
        canvas.height = sourceVideo.videoHeight || 720;

        sourceVideo.currentTime = 0;
        
        try {
            await sourceVideo.play();
        } catch (err) {
            console.log(err);
        }

        const stream = canvas.captureStream(30);
        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm' };
        }

        let mediaRecorder;
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            mediaRecorder = new MediaRecorder(stream);
        }

        let recordedChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            downloadLink.href = url;
            downloadLink.download = 'videoglow-enhanced.webm';
            downloadLink.classList.remove('hidden');
            downloadLink.textContent = '📥 Download Enhanced Video';
            statusDiv.textContent = 'Export complete! Click below to download.';
            exportBtn.disabled = false;
        };

        mediaRecorder.start();

        function drawFrame() {
            if (!sourceVideo.paused && !sourceVideo.ended) {
                // Directly apply the filter string to canvas context
                ctx.filter = getFilterCSSString();
                ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
                requestAnimationFrame(drawFrame);
            } else {
                mediaRecorder.stop();
            }
        }

        dra
      wFrame();
    });
});
