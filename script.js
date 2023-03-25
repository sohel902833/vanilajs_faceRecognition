const imageUpload = document.getElementById("imageUpload");

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
]).then(start);

async function start() {
  const container = document.createElement("div");
  container.style.position = "relative";
  document.body.append(container);

  const labeledFaceDescriptors = await loadLabeledImagesV2();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  document.body.append("Loaded");
  let image;
  let canvas;
  imageUpload.addEventListener("change", async () => {
    if (image) {
      image.remove();
    }
    if (canvas) {
      canvas.remove();
    }
    image = await faceapi.bufferToImage(imageUpload.files[0]);
    container.append(image);
    canvas = faceapi.createCanvasFromMedia(image);
    container.append(canvas);
    const displaySize = { width: 700, height: 700 };
    faceapi.matchDimensions(canvas, displaySize);
    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();
    console.log("Detections", detections);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      drawBox.draw(canvas);
    });
  });
}

const loadLabeledImagesV2 = () => {
  const labels = [
    {
      label: "Biplob",
      images: [
        "https://i.postimg.cc/j2z4FMKR/1.jpg",
        "https://i.postimg.cc/4yC1PrD8/2.jpg",
      ],
    },
    {
      label: "Sohel",
      images: [
        "https://i.postimg.cc/Fz7QbJQb/1.jpg",
        "https://i.postimg.cc/3NVQtJKs/2.jpg",
      ],
    },
  ];

  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i of label.images) {
        const img = await faceapi.fetchImage(i);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }

      return new faceapi.LabeledFaceDescriptors(label.label, descriptions);
    })
  );
};
