// Attach modal function to HTMLElement prototype for easy access
HTMLElement.prototype.modal = function(action) {

    if(this.style.display==="none") {
        this.style.display="block";
    } else {
        this.style.display="none";
    }

    this.querySelectorAll('[data-dismiss="modal"]').forEach(el=>{
        if(!el.onclick) {
            el.onclick = ()=>{
                this.style.display="none";
            }
        }
    })

    this.addEventListener('click', function(event) {
        // Check if the clicked element is inside a modal but outside modal-content
        const isOutsideModalContent = !event.target.closest('.modal-content');
        const isInsideModal = event.target.closest('.modal') !== null;
      
        if (isOutsideModalContent && isInsideModal) {
            // Close the modal
            event.target.closest('.modal').style.display = 'none';
        }
    });
};