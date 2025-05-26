console.log('Image modal script is loading...'); // Very early log

// Function to initialize image modal functionality
function initializeImageModal() {
    console.log('=== INITIALIZING IMAGE MODAL ==='); // Obvious log

    // Create modal elements if they don't exist
    let modal = document.querySelector('.image-modal');
    if (!modal) {
        console.log('Creating modal element');
        modal = document.createElement('div');
        modal.className = 'image-modal';
        
        const closeButtonWrapper = document.createElement('div');
        closeButtonWrapper.className = 'close-button';

        const closeButton = document.createElement('div');
        closeButton.style.transform = 'translateY(-2.5px)';
        closeButton.innerHTML = '×';
        closeButtonWrapper.appendChild(closeButton);
        
        const modalImage = document.createElement('img');
        modal.appendChild(modalImage);
        modal.appendChild(closeButtonWrapper);
        document.body.appendChild(modal);

        // Close modal when clicking the close button or outside the image
        closeButton.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Flag to prevent infinite loop
    let isProcessingImages = false;

    // Function to attach click handlers to images
    function attachImageHandlers() {
        // Prevent recursive processing
        if (isProcessingImages) return;
        isProcessingImages = true;

        try {
            // Only look for images in our target containers that don't have the modal handler yet
            const images = document.querySelectorAll('#side-a img:not([data-modal-initialized]), #summary-inner img:not([data-modal-initialized])');
            console.log('=== TARGET IMAGES ===');
            console.log('Found', images.length, 'new images to process');

            images.forEach(img => {
                console.log('Processing image:', img.src);
                
                // Mark the image as initialized
                img.setAttribute('data-modal-initialized', 'true');
                
                // Add click handler
                img.addEventListener('click', function(e) {
                    console.log('!!! IMAGE CLICKED !!!', this.src);
                    e.stopPropagation();
                    const modalImage = modal.querySelector('img');
                    modalImage.src = this.src;
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });

                // Prevent clicks on buttons from triggering the modal
                const imgWrapper = img.closest('.img-wrapper');
                if (imgWrapper) {
                    const buttons = imgWrapper.querySelectorAll('.clickable');
                    buttons.forEach(button => {
                        button.addEventListener('click', (e) => {
                            e.stopPropagation();
                        });
                    });
                }
            });
        } finally {
            isProcessingImages = false;
        }
    }

    // Initial attachment of handlers
    attachImageHandlers();

    // Set up MutationObserver to watch for changes in the note content
    const observer = new MutationObserver((mutations) => {
        // Only process if there are actual changes to images
        const hasImageChanges = mutations.some(mutation => {
            return Array.from(mutation.addedNodes).some(node => 
                node.nodeName === 'IMG' || 
                (node.nodeType === Node.ELEMENT_NODE && node.querySelector('img'))
            );
        });

        if (hasImageChanges) {
            console.log('=== DOM CHANGED - Processing new images ===');
            attachImageHandlers();
        }
    });

    // Only observe the note content areas
    const noteContent = document.querySelector('#side-a, #summary-inner');
    if (noteContent) {
        observer.observe(noteContent, {
            childList: true,
            subtree: true
        });
    }
}

// Only initialize when a note is opened
document.addEventListener('noteOpened', function() {
    console.log('Note opened - initializing image modal');
    initializeImageModal();
}); 