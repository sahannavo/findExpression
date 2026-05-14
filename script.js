
        // Initialize Lucide Icons
        lucide.createIcons();

        // DOM Elements
        const video = document.getElementById('video');
        const startBtn = document.getElementById('toggle-camera-btn');
        const statusBadge = document.getElementById('status-badge');
        const statusText = document.getElementById('status-text');
        const statusIcon = document.getElementById('status-icon');
        const placeholder = document.getElementById('camera-placeholder');
        const videoContainer = video.parentElement;

        let isCameraActive = false;
        let stream = null;
        let detectionInterval = null;

        // URLs for the pre-trained models. Using a public CDN for ease of use.
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

        // Load Models
        async function loadModels() {
            try {
                // Using tinyFaceDetector for better performance in browser
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
                ]);
                
                console.log("Models loaded successfully");
                // Update UI: Models loaded
                setStatus('ready');
                startBtn.disabled = false;
            } catch (err) {
                console.error("Error loading models:", err);
                setStatus('error', 'Failed to load AI models. Check console.');
            }
        }

        // Setup WebCam
        async function startVideo() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "user" 
                    } 
                });
                video.srcObject = stream;
                video.classList.remove('hidden');
                placeholder.classList.add('hidden');
                isCameraActive = true;
                
                // Update Button UI
                startBtn.innerHTML = `<i data-lucide="video-off" class="w-4 h-4"></i><span>Stop Camera</span>`;
                startBtn.classList.replace('bg-blue-600', 'bg-red-600');
                startBtn.classList.replace('hover:bg-blue-500', 'hover:bg-red-500');
                startBtn.classList.replace('shadow-blue-500/20', 'shadow-red-500/20');
                lucide.createIcons();
                
                setStatus('active', 'Camera Active & Tracking');
            } catch (err) {
                console.error("Error accessing webcam:", err);
                alert("Please enable camera permissions to use this feature.");
                setStatus('ready', 'Ready (Camera Access Denied)');
            }
        }

        function stopVideo() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            video.srcObject = null;
            video.classList.add('hidden');
            placeholder.classList.remove('hidden');
            isCameraActive = false;
            
            if (detectionInterval) clearInterval(detectionInterval);
            
            // Remove existing canvas
            const existingCanvas = videoContainer.querySelector('canvas');
            if (existingCanvas) existingCanvas.remove();

            // Update Button UI
            startBtn.innerHTML = `<i data-lucide="video" class="w-4 h-4"></i><span>Start Camera</span>`;
            startBtn.classList.replace('bg-red-600', 'bg-blue-600');
            startBtn.classList.replace('hover:bg-red-500', 'hover:bg-blue-500');
            startBtn.classList.replace('shadow-red-500/20', 'shadow-blue-500/20');
            lucide.createIcons();

            setStatus('ready', 'System Ready');
        }

        // Handle Button Click
        startBtn.addEventListener('click', () => {
            if (isCameraActive) {
                stopVideo();
            } else {
                startVideo();
            }
        });

        // Face Detection Logic when video plays
        video.addEventListener('play', () => {
            // Remove any existing canvas before creating a new one
            const existingCanvas = videoContainer.querySelector('canvas');
            if (existingCanvas) existingCanvas.remove();

            const canvas = faceapi.createCanvasFromMedia(video);
            videoContainer.append(canvas);
            
            // Calculate display size matching the video element's actual rendered size
            const displaySize = { 
                width: video.clientWidth, 
                height: video.clientHeight 
            };
            faceapi.matchDimensions(canvas, displaySize);

            // Handle window resize to adjust canvas
            window.addEventListener('resize', () => {
                if(!isCameraActive) return;
                displaySize.width = video.clientWidth;
                displaySize.height = video.clientHeight;
                faceapi.matchDimensions(canvas, displaySize);
            });

            // Start detection loop
            detectionInterval = setInterval(async () => {
                if(!isCameraActive) return;

                try {
                    const detections = await faceapi.detectAllFaces(
                        video, 
                        new faceapi.TinyFaceDetectorOptions()
                    )
                    .withFaceLandmarks()
                    .withFaceExpressions();

                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    
                    // Clear previous drawings
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw results
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
                } catch (error) {
                    console.error("Detection error:", error);
                }
            }, 100); // Run every 100ms
        });

        // Helper to update status UI
        function setStatus(state, customText = '') {
            statusBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors';
            
            if (state === 'loading') {
                statusBadge.classList.add('bg-yellow-500/10', 'text-yellow-500', 'border-yellow-500/20');
                statusText.innerText = customText || 'Loading Models...';
                statusIcon.setAttribute('data-lucide', 'loader-2');
                statusIcon.classList.add('animate-spin');
            } else if (state === 'ready') {
                statusBadge.classList.add('bg-green-500/10', 'text-green-500', 'border-green-500/20');
                statusText.innerText = customText || 'System Ready';
                statusIcon.setAttribute('data-lucide', 'check-circle-2');
                statusIcon.classList.remove('animate-spin');
            } else if (state === 'active') {
                statusBadge.classList.add('bg-blue-500/10', 'text-blue-400', 'border-blue-500/20');
                statusText.innerText = customText || 'Camera Active';
                statusIcon.setAttribute('data-lucide', 'activity');
                statusIcon.classList.remove('animate-spin');
            } else if (state === 'error') {
                statusBadge.classList.add('bg-red-500/10', 'text-red-500', 'border-red-500/20');
                statusText.innerText = customText || 'Error Occurred';
                statusIcon.setAttribute('data-lucide', 'alert-circle');
                statusIcon.classList.remove('animate-spin');
            }
            lucide.createIcons();
        }

        // Start the app by loading models immediately
        window.onload = loadModels;
