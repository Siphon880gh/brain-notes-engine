 <div id="rearrange-container" class="card card-default hide">
    <div class="card-header">
        <h2 class="text-center"><span class="fa fa-puzzle-piece"></span> Learn by rearranging lines</h2>
    </div>
    <div class="card-body">
        <p class="text-center"><button class="btn btn-success-off btn-sm"
                onclick='if($("#old .contents").text().length===0) { $("#modal-error .message").text("You need to have text in the template area"); $("#modal-error").modal("show"); } else $("#modal-puzzle").modal("show");'>Rearrange
                lines <i class="fa fa-sign-out-alt"></i></button></p>
    </div>
</div>