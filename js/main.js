function log(a){
    if (!window.console){return false}
    console.log(a)
}

function dir(a){
    if (!window.console){return false}
    console.dir(a)
}

function Uploader(self){
    this.input = self
    this.file = self.files[0]
}

Uploader.prototype.sizeCheck = function(){ //compares filesize to limits
    log('sizeCheck: checking file size')
    var redableLimit, rawLimit, limit, id
    var size = this.getSize(this.file.size)
    
    if (this.file.type.match("image")) {
        rawLimit = 2500000
        limit = '2.5 MB'
        id = 'images'
    } else if (this.file.type.match("audio")) {
        rawLimit = 5000000
        limit = '5 MB'
        id = 'audio clips'
    } else if (this.file.type.match("video")) {
        rawLimit = 15000000
        limit = '15 MB'
        id = 'videos'
    } else {
        alert('Only image, video, and audio file types are allowed.')
        return false
    }
    
    if (this.file.size > rawLimit) {
        readableLimit = this.getSize(rawLimit)
        this.clearMedia()
        app.$sizeEl.text('Sorry, but the maximum file size for ' + id + ' is ' + readableLimit + '. ' + this.file.name + ' is ' + size).prependTo('.specs')
        return false
    } else {
        this.showSpecs(size)
        return true
    }   
}

Uploader.prototype.getSize = function(size){ // gets file size in a readable format
    log('getSize: converting file size')
    var nBytes = size
    var output = nBytes + ' bytes'
    for (var multiples = ['KB', 'MB'], n = 0, approx = nBytes/1024; approx > 1; approx /= 1024, n++) {
        output = approx.toFixed(2) + ' ' + multiples[n]
    }
    
    return output  
}

Uploader.prototype.showSpecs = function(size){ // injects file name and size into DOM
    log('showSpecs: display file specs in DOM')
    app.$sizeEl.text(size).prependTo('.specs')
    app.$nameEl.text(this.file.name + ': ').prependTo('.specs')
    app.$preview.append(app.$clearButton)
}

Uploader.prototype.clearMedia = function(){ // clears selected media and resets file inputs for new selection
    app.$preview.find('img, #size, #filename').remove()
    
    if (!!app.oldInputs) {
        $(app.oldInputs).remove()
    }
    if (!!app.oldPhoto) {
        // Regular Post
        app.$preview.append(oldPhoto)   
    } else {
        // Profile setup
        app.$preview.removeClass('loaded')
    }
    var $inputs = $('input[type=file]')
    $inputs.val('').prop('disabled', false)
    $inputs.parent().removeClass('disabled')
}

Uploader.prototype.disableOthers = function(self){ // disables other media inputs after user chooses one for upload
    log('disabling others')
    $notSelected = $('input[type=file]').not(self)
    $notSelected.parent().addClass('disabled')
    $notSelected.prop('disabled', true)
}

Uploader.prototype.init = function(){
    log('initializing uplaoder')
    app.loader.classList.add('begin')
    if (!this.sizeCheck(this.file)){
        log('file too big')
        app.loader.classList.remove('begin')
        return false
    } 
    this.disableOthers(this.input)
    return true
}

function ImageUploader(self){
    Uploader.call(this, self)
}

ImageUploader.prototype = Object.create(Uploader.prototype)

ImageUploader.prototype.imagePreview = function(img){ // injects image preview into DOM
    app.$preview.find('.thumb').prepend(img)
    if (!!$('.full-profile').length){
        app.$clearButton.html('Revert')
    }
    app.$preview.addClass('loaded')
}

ImageUploader.prototype.init = function(){
    if (!Uploader.prototype.init.call(this)){
        return false
    }
    self = this
    self.reader = new FileReader()
    self.image = new Image()
    self.reader.onload = function(event) {
        self.image.src = event.target.result
    }
    self.reader.onloadend = function() {
        app.loader.classList.remove('begin')
    }
    self.image.onload = function(){
        self.imagePreview(this)
    }
    self.reader.readAsDataURL(this.file)
}

function PostUploader(self){
   Uploader.call(this,self) 
}

PostUploader.prototype = Object.create(Uploader.prototype)

function PostImageUploader(self){
    ImageUploader.call(this, self)
}

PostImageUploader.prototype = Object.create(ImageUploader.prototype)
PostImageUploader.prototype.init = function(){
    ImageUploader.prototype.init.call(this)
    $(this.reader).on('load',function(e){ log('adding but not replacing')})
}
app = {
    $sizeEl : $('<span/>').addClass('size').attr('id','size'),
    $clearButton : $('<button/>').attr({'class':'clear','id':'clear','type':'button'}).html('Clear'), // user-intent to clear current inputs
    $nameEl : $('<span/>').addClass('filename').attr('id','filename'),
    $preview : $('.preview'),
    loader : document.getElementById('loading'),
    polyfillReader : function(file){  // used by native FileReader
        var reader = new FileReader()
        if (file.type.match('image')){
            var image = new Image()
            reader.onload = function(event) {
                props.data = event.target.result // sending data via POST
                image.src = event.target.result
            }
            image.onload = function(){
                updatePreview(this)
            }
            reader.onloadend = function(){ // sending data via POST
                prepInputs(file, self)
                $('.loading').removeClass('begin')
            }
        } else {
            reader.onload = function(event) {
                updatePreview()
                props.data = event.target.result // sending data via POST
            }
            reader.onloadend = function(){ // sending data via POST
                prepInputs(file, self)
                $('.loading').removeClass('begin')
            }
        }
        return reader
    }, 
    init : function(file){ //do stuff, called on change event, passed file
        
    }
}
$(function(){
    log('loaded')
    
    $('.upload-buttons').change('input',function(e){ 
        log('change event called')
        log('creating new uploader')
        if (e.target.accept.match("image/*")){
            uploader = new PostImageUploader(e.target)
        } else {
            uploader = new Uploader(e.target) 
        }
        uploader.init()
    })
    $('#preview').click('#clear', function(evt){
        try {
            uploader.clearMedia(app.oldPhoto)
        } catch(e){
            uploader.clearMedia()
        }
        $(evt.target).detach()
    })
})    
