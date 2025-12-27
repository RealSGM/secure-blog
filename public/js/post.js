window.onload = function() {
    const imgElement = document.getElementById('banner-image');
    const bannerContainer = document.querySelector('.banner-container');

    imgElement.onload = function() {
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to image size
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;

        // Draw the image onto the canvas
        ctx.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height);

        // Get the image data (pixels) from the canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Object to keep track of color frequencies
        const colorCount = {};

        // Loop through the pixels and count frequencies of each color
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // Create a unique key for the color (convert RGB to string)
            const colorKey = `${r},${g},${b}`;

            // Increment the count of the color
            if (colorCount[colorKey]) {
                colorCount[colorKey]++;
            } else {
                colorCount[colorKey] = 1;
            }
        }

        // Find the most frequent color
        let maxCount = 0;
        let mostCommonColor = '';

        for (const color in colorCount) {
            if (colorCount[color] > maxCount) {
                maxCount = colorCount[color];
                mostCommonColor = color;
            }
        }

        // Set the background color of the banner container to the most common color
        const [r, g, b] = mostCommonColor.split(',').map(Number);
        bannerContainer.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    };

    // If the image is already loaded, trigger the onload function
    if (imgElement.complete) {
        imgElement.onload();
    }
};
