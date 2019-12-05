
$(document).ready(function(){

    $('#profile-image1').click( function() {
        $('#profile-image-upload').click();
    });


    $('#edit-btn').click(function () { 
        $('.edit').addClass('into');
        $(this).hide();
        return false;
    });

    // $('#confirm-btn').click(function () { 
    //     $('.edit').removeClass('into');
    //     $('#edit-btn').show();
    //     return false;
    // });

});

// document.addEventListener('DOMContentLoaded',()=>{

//     var doc = document.getElementById('edit-btn');
//     doc.addEventListener('click',()=>{
//         var doc1 = document.querySelector('.edit');
//         doc1.classList.add('into');
//     })
// });