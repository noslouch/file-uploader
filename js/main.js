function log(a){
    if (!window.console){return false}
    console.log(a)
}

function dir(a){
    if (!window.console){return false}
    console.dir(a)
}

Modernizr.load([{
    test: Modernizr.filereader,
    nope : ['js/jquery-ui/jquery-ui-position.js', 'js/filereader/jquery.FileReader.js', 'js/swfobject/swfobject.js' ],
    complete : function(){
        if (!Modernizr.filereader){
            log('filereader not supported')
            $('input[type=file]').fileReader({
                id : 'fileReaderSWF',
                filereader : 'js/filereader/filereader.swf',
                expressInstall : 'js/swfobject/expressInstall.swf',
                debugMode : true
            })
        }
    }
}])

function Uploader(e){
    this.file = e.files[0]
    if (!Modernizr.filereader){
        polyfillMixin.call(this, e)
    }  else { 
        this.input = e
    }
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
    $(app.preview).append(app.$clearButton)
}

Uploader.prototype.clearMedia = function(){ // clears selected media and resets file inputs for new selection
    var $inputs = $('input[type=file]')

    $inputs.val('').prop('disabled', false)
    $inputs.parent().removeClass('disabled')

    $(app.preview).find('img, #size, #filename').remove()
    
    if (!!app.oldInputs) {
        $(app.oldInputs).remove()
    }
    if (!!app.oldPhoto) {
        // Regular Post
        $(app.preview).append(oldPhoto)   
    } else {
        // Profile setup
        $(app.preview).removeClass('loaded')
    }
}

Uploader.prototype.disableOthers = function(self){ // disables other media inputs after user chooses one for upload
    log('disabling others')
    var $notSelected = $('input[type=file]').not(self)
    $notSelected.parent().addClass('disabled')
    $notSelected.prop('disabled', true)
}

Uploader.prototype.init = function(){
    log('initializing uplaoder')
    if (!this.sizeCheck(this.file)){
        log('file too big')
        $(app.loader).removeClass('begin')
        return false
    } 
    $(app.loader).addClass('begin')
    this.disableOthers(this.input)
    log('checking for FileReader support')
    
    return true
}

function ImageUploader(self){
    Uploader.call(this, self)
}

ImageUploader.prototype = Object.create(Uploader.prototype)

ImageUploader.prototype.imagePreview = function(img){ // injects image preview into DOM
    $(app.preview).find('.thumb').prepend(img)
    //if (!!$('.full-profile').length){
    //    app.$clearButton.html('Revert')
    //}
    $(app.preview).addClass('loaded')
}

ImageUploader.prototype.init = function(){
    if (!Uploader.prototype.init.call(this)){
        return false
    }
    var self = this
    var r = self.reader = self.reader || new FileReader()
    self.image = new Image()

    $(r).on('load', function(event) {
        self.image.src = event.target.result
        log('ImageUploader.prototype reader load event')
    })
    $(r).on('loadend', function() {
        app.loader.classList.remove('begin')
        log('ImageUploader.prototype reader loadend event')
    })

    self.image.onload = function(){
        self.imagePreview(this)
    }
    r.readAsDataURL(this.file)
}

function polyfillMixin(e){
    var uploader = this
    var file = uploader.file
    this.input = document.getElementsByName(file.input)
    var inputName = file.input
    var r = uploader.reader = uploader.reader || new FileReader()
    var props = {}

    props['name'] = file.name
    props['type'] = file.type
    props['size'] = file.size

    function attachFile(){    
        app.oldInputs = []
        
        for (prop in props) {
            var toPHP = document.createElement('input')
            if (props.hasOwnProperty(prop)) {
                toPHP.type = 'hidden'
                toPHP.name = inputName + '['+prop+']'
                toPHP.value = props[prop]
                app.form.appendChild(toPHP)
                app.oldInputs.push(toPHP)
            }
        }
    }

    $(r).on('load', function(e){
        log('load event edited by polyfillMixin')
        props.data = e.target.result
    })
    $(r).on('loadend', function(e){
        log('loadend event edited by polyfillMixin')
        attachFile()
    })
    
    if (!(this instanceof ImageUploader)){
        r.readAsDataURL(this.file)
    }
}

app = {
    $sizeEl : $('<span/>').addClass('size').attr('id','size'),
    $clearButton : $('<button/>').attr({'class':'clear','id':'clear','type':'button'}).html('Clear'), // user-intent to clear current inputs
    $nameEl : $('<span/>').addClass('filename').attr('id','filename'),
    preview : document.getElementById('preview'),
    loader : document.getElementById('loading'),
    form : document.getElementById('post-form'),
    oldInputs: []
}
$(function(){
    
    $('.upload-buttons').on('change', null, function(e){ 
        log('change event called')
        log('creating new uploader')
        if (e.target.files[0].type.match("image/*")){
            uploader = new ImageUploader(e.target)
        } else {
            uploader = new Uploader(e.target)
        }
        uploader.init()
    })

    $(app.preview).on('click', '#clear', function(evt){
        try {
            uploader.clearMedia(app.oldPhoto)
        } catch(e){
            uploader.clearMedia()
        }
        $(evt.target).detach()
    })

})    
