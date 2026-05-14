const video = document.getElementById("video");
// load models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
])

.then(() => {
    console.log("Models loaded");
    startVideo();
})
.catch(err => console.error("Model load error:", err));



function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })  
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}


video.addEventListener('play',()=>{
    // Create canvas
    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
     
     // Center the video and canvas
    const container = document.body;
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';

    const displaySize ={width:video.width,height:video.height}
    faceapi.matchDimensions(canvas,displaySize)
 // DELAY PARAMETER (100ms)
    setInterval(async() => {
        const detections = await faceapi.detectAllFaces(video,new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        // Clear previous drawings
        canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height)
        faceapi.draw.drawDetections(canvas,resizedDetections)

        faceapi.draw.drawFaceLandmarks(canvas,resizedDetections)

        faceapi.draw.drawFaceExpressions(canvas,resizedDetections)
    },100)
})
   