document.getElementById('imageUpload').addEventListener('change', function(event) {
    const fileNameDisplay = document.getElementById('fileName');
    if (event.target.files.length > 0) {
        const fileName = event.target.files[0].name;
        fileNameDisplay.textContent = fileName.length > 20 ? fileName.slice(0, 20) + '...' : fileName;
    } else {
        fileNameDisplay.textContent = "No file chosen";
    }
});
