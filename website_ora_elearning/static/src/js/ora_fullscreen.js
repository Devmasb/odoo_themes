odoo.define('website_ora_elearning.ora', function (require) {
    '"use strict"';
    
    var core = require('web.core');
    var _lt = core._lt;
    var QWeb = core.qweb;
    var publicWidget = require('web.public.widget');
    var wysiwygLoader = require('web_editor.loader');
    var Fullscreen = require('@website_slides/js/slides_course_fullscreen_player')[Symbol.for("default")];
    const {Markup} = require('web.utils');
    /**
     * Helper: Get the slide dict matching the given criteria
     *
     * @private
     * @param {Array<Object>} slideList List of dict reprensenting a slide
     * @param {Object} matcher (see https://underscorejs.org/#matcher)
     */
    var findSlide = function (slideList, matcher) {
        var slideMatch = _.matcher(matcher);
        return _.find(slideList, slideMatch);
    };
    
    
    Fullscreen.include({
        xmlDependencies: (Fullscreen.prototype.xmlDependencies || []).concat(
            ["/website_ora_elearning/static/src/xml/slide_ora.xml"]
        ),
        events: _.extend({}, Fullscreen.prototype.events, {
            "click .o_wslides_js_lesson_ora_submit": '_submitOra',
            "click .o_submit_peer_response": '_submitPeer',
            "click .o_wslides_fs_toggle_sidebar": '_onClickToggleSidebar',
            "click .o_wslides_ora_continue": '_onClickOraNext'
        }),
        /**
        * @override
        * @param {Object} el
        * @param {Object} slides Contains the list of all slides of the course
        * @param {integer} defaultSlideId Contains the ID of the slide requested by the user
        */
        init: function (parent, slides, defaultSlideId, channelData){
            var result = this._super.apply(this,arguments);
            var slide;
            var urlParams = $.deparam.querystring();
            if (defaultSlideId) {
                slide = findSlide(slides, {id: defaultSlideId, isQuiz: urlParams.quiz === "1"});
            } else {
                slide = this.slides[0];
            }
            this.set('slide', slide);
            this.sidebar = new NewSidebar(this, this.slides, slide);
            return result;
        },
        _preprocessSlideData: function (slidesDataList) {
            var res = this._super.apply(this, arguments);
            res.forEach(function (slideData, index) {
                slideData.isOra = !!slideData.isOra;
                slideData.hasQuestion = !!slideData.hasQuestion;
                try {
                    if (!(slideData.isOra) && !(slideData.hasQuestion)) {
                        slideData._autoSetDone = true;
                    }
                }
                catch {
                    if (!(slideData.hasQuestion)) {
                        slideData._autoSetDone = true;
                    }
                }
            });
            return res;
        },
        _onChangeSlideRequest: function (ev){
            var slideData = ev.data;
            var newSlide = findSlide(this.slides, {
                id: slideData.id,
                isQuiz: slideData.isQuiz || false,
                isOra: slideData.isOra || false,
            });
            this.set('slide', newSlide);
            this.shareButton._onChangeSlide(newSlide);
        },
        /**
         * Triggering a event to switch to next slide
         *
         * @private
         * @param OdooEvent ev
         */
        _onClickOraNext: function (ev) {
            var self = this;
            // || (this.get('slide').hasOra == 1 && this.get('slide').hasQuestion == true && this.get('slide').is_sequential == true && this.get(''))
            if (this.get('slide').isOra === true){
                this._rpc({
                    route: '/slides/slide/get_values',
                    params: {
                        slide_id:(this.get('slide').id),
                    }
                }).then(function (data){
                        if (data.slide.hasNext && data.slide.next_slide_url && !data.slide.ispro) {
                            var url = data.slide.next_slide_url;
                            window.location.replace(url);
                        }
                        if (data.slide.hasNext && data.slide.next_slide_url && data.slide.ispro){
                            // self._load_dom_content();
                            var slide = $('.o_wslides_fs_sidebar_list_item.active');
                            // if ((slide.data().isSequential && (slide.data().category == 'quiz' || slide.data().hasQuestion))  || ((slide.data().isTimer || slide.data().isSequential) && slide.data().hasOra)){
                                var $slides = this.$('.o_wslides_fs_sidebar_list_item');
                                var slideListdata = [];
                                var slideList = []
                                $slides.each(function () {
                                    var slideData = $(this).data();
                                    if (slideData.category == 'video' && slideData.videoSourceType !== 'vimeo' && !slideData.hasQuestion && !slideData.embedCode.includes('iframe')){
                                        slideData.embedCode = '<iframe src=\"'+ slideData.embedCode + '\" allowFullScreen=\"true\" frameborder=\"0\"></iframe>'
                                    }
                                    slideListdata.push(slideData);
                                    slideList.push($(this));
                                });
                                var slide_list_data = self._preprocessSlideData(slideListdata);
                                var index = 0;
                                if (slide.data().category == 'quiz'){
                                    for(let [i,v] of slideList.entries()){
                                        if(v[0].classList.contains('active')){
                                            index = i;
                                        }
                                    }
                                }
                                else if ((slide.data().category != 'quiz' && slide.data().hasQuestion) || slide.data().hasOra){
                                    for(let [i,v] of slideList.entries()){
                                        if(v[0].classList.contains('active')){
                                            index = i + 1;
                                        }
                                    }
                                }
                                if (index == slideList.length){
                                    index = index - 1
                                }
                                var next_slide = slide_list_data[index + 1];
                                if (next_slide === self.get('slide')){
                                    next_slide = slide_list_data[index + 2]; 
                                }
                                next_slide['canAccess'] = 'True';
                                var next_slide_list = slideList[index + 1]
                                if (next_slide_list === self.get('slide')){
                                    next_slide_list = slide_list_data[index + 2]; 
                                }
                                var next_div = next_slide_list.find('.o_wslides_fs_slide_name');
                                self.slides.push(next_slide);
                                slide.removeClass('active');
                                $('.o_sidebar_link').attr("href", '#');
                                $('.o_btn_set_done').addClass('d-none');
                                $('.o_btn_next_slide').addClass('d-none');
                                next_slide_list.addClass('active');
                                next_slide_list.removeClass('disabled')
                                next_slide_list.removeClass('text-600')
                                next_div.removeClass('text-600');
                                if (slide.data()['hasQuestion'] || slide.data()['isQuiz'] || slide.data()['hasOra']){
                                    var next_quiz = slide.find('.o_wslides_fs_sidebar_list_item a');
                                    next_quiz.attr("href", '#');
                                    next_quiz.removeClass('text-600');
                                    var next_mini = slide.find('.o_wslides_fs_sidebar_list_item span');
                                    next_mini.attr("href", '#');
                                    next_mini.removeClass('text-600');
                                }
                                self.sidebar.set('slideEntry',{
                                    id: next_slide.id,
                                    isQuiz: next_slide.isQuiz || false
                                });
                            // }
                        }
                    });
                }
        },

        _renderSlide: function (){
            var def = this._super.apply(this, arguments);
            var $content = this.$('.o_wslides_fs_content');
            var self = this;
            if (this.get('slide').isOra === true){
                this._rpc({
                    route: '/slides/slide/get_values',
                    params: {
                        slide_id:(this.get('slide').id),
                    }
                }).then(function (data){
                    if (data.slide_prompts){
                        for (let i = 0; i < data.slide_prompts.length; i++) {
                            data.slide_prompts[i].question = Markup(data.slide_prompts[i].question)
                        }
                    }
                    if (data.total_responses){
                        for (let i = 0; i < data.total_responses.length; i++) {
                            for (let j = 0; j < (data.total_responses[i].user_response_line).length; j++){
                                data.total_responses[i].user_response_line[j].value_richtext_box = Markup(data.total_responses[i].user_response_line[j].value_richtext_box)
                            }
                        }
                    }
                    $content.html(QWeb.render('slide.ora.assessment',{widget: data}));
                    self._load_dom_content();
                    _.each($('textarea.o_wysiwyg_loader'), async function (textarea) {
                        self._wysiwyg = await wysiwygLoader.loadFromTextarea(self, textarea, {
                            resizable: true,
                            userGeneratedContent: true,
                            toolbar: ['video', ['video', 'audio']]
                        });
                    });
                    // _.each(this.$('.o_wforum_bio_popover'), authorBox => {
                    //     $(authorBox).popover({
                    //         trigger: 'hover',
                    //         offset: 10,
                    //         animation: false,
                    //         html: true,
                    //     });
                    // });
                    $('.custom_response').click(function() {
                        var id = this.id.split('-')[this.id.split('-').length - 1]
                        if($('#collapse_div_'+id).hasClass('show')) {
                            $(this).children().text(_lt('View Response'))
                        }else {
                            $(this).children().text(_lt('Hide Response'))
                        }
                    });
                });
            }
            return Promise.all([def]);
        },
        _load_dom_content: function(){
            var textareaEls = document.querySelectorAll('textarea.o_wysiwyg_loader');
            for (var i = 0; i < textareaEls.length; i++) {
                var textarea = textareaEls[i];
                var wrapper = document.createElement('div');
                wrapper.classList.add('position-relative', 'o_wysiwyg_textarea_wrapper');
                var loadingElement = document.createElement('div');
                loadingElement.classList.add('o_wysiwyg_loading');
                var loadingIcon = document.createElement('i');
                loadingIcon.classList.add('text-600', 'text-center',
                    'fa', 'fa-circle-o-notch', 'fa-spin', 'fa-2x');
                loadingElement.appendChild(loadingIcon);
                wrapper.appendChild(loadingElement);
                textarea.parentNode.insertBefore(wrapper, textarea);
                wrapper.insertBefore(textarea, loadingElement);
            }
        },
        _submitPeer: function (ev) {
            var id = ev.currentTarget.id.split('_')[ev.currentTarget.id.split('_').length - 1]
            var data = $('#ora_peer_submit_'+id).serializeArray();
            var self = this;
            ev.preventDefault();
            $.ajax({
                type: "POST",
                url: "/submit/peer/response",
                data: data,
                success: function (data) {
                    self._renderSlide();
                }
            });
        },
    
        _submitOra: function (ev) {
            var data = $('#ora_form').serializeArray();
            data.push({name: ev.currentTarget.name, value: ev.currentTarget.value});
            ev.preventDefault();
            var self = this;
            $.ajax({
                type: "POST",
                url: "/ora/response/save/",
                data: data,
                success: function (data) {
                    self._renderSlide();
                }
            });
        },
    });
    /**
     * This widget is responsible of navigation for one slide to another:
     *  - by clicking on any slide list entry
     *  - by mouse click (next / prev)
     *  - by recieving the order to go to prev/next slide (`goPrevious` and `goNext` public methods)
     *
     * The widget will trigger an event `change_slide` with
     * the `slideId` and `isMiniQuiz` as data.
     */
    var NewSidebar = publicWidget.Widget.extend({
        events: {
            "click .o_wslides_fs_sidebar_list_item": '_onClickTab',
        },
        init: function (parent, slideList, defaultSlide) {
            var result = this._super.apply(this, arguments);
            this.slideEntries = slideList;
            this.set('slideEntry', defaultSlide);
            return result;
        },
        start: function (){
            var self = this;
            this.on('change:slideEntry', this, this._onChangeCurrentSlide);
            return this._super.apply(this, arguments).then(function (){
                $(document).keydown(self._onKeyDown.bind(self));
            });
        },
        destroy: function () {
            $(document).unbind('keydown', this._onKeyDown.bind(this));
            return this._super.apply(this, arguments);
        },
        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------
        /**
         * Change the current slide with the next one (if there is one).
         *
         * @public
         */
        goNext: function () {
            var currentIndex = this._getCurrentIndex();
            if (currentIndex < this.slideEntries.length-1) {
                this.set('slideEntry', this.slideEntries[currentIndex+1]);
            }
        },
        /**
         * Change the current slide with the previous one (if there is one).
         *
         * @public
         */
        goPrevious: function () {
            var currentIndex = this._getCurrentIndex();
            if (currentIndex >= 1) {
                this.set('slideEntry', this.slideEntries[currentIndex-1]);
            }
        },
        /**
         * Greens up the bullet when the slide is completed
         *
         * @public
         * @param {Integer} slideId
         */
        setSlideCompleted: function (slideId) {
            var $elem = this.$('.fa-circle-thin[data-slide-id="'+slideId+'"]');
            $elem.removeClass('fa-circle-thin').addClass('fa-check text-success o_wslides_slide_completed');
        },
        /**
         * Updates the progressbar whenever a lesson is completed
         *
         * @public
         * @param {*} channelCompletion
         */
        updateProgressbar: function (channelCompletion) {
            var completion = Math.min(100, channelCompletion);
            this.$('.progress-bar').css('width', completion + "%" );
            this.$('.o_wslides_progress_percentage').text(completion);
        },
    
        //--------------------------------------------------------------------------
        // Private
        //--------------------------------------------------------------------------
        /**
         * Get the index of the current slide entry (slide and/or quiz)
         */
        _getCurrentIndex: function () {
            var slide = this.get('slideEntry');
            var currentIndex = _.findIndex(this.slideEntries, function (entry) {
                return entry.id === slide.id && entry.isQuiz === slide.isQuiz;
            });
            return currentIndex;
        },
        //--------------------------------------------------------------------------
        // Handler
        //--------------------------------------------------------------------------
        /**
         * Handler called whenever the user clicks on a sub-quiz which is linked to a slide.
         * This does NOT handle the case of a slide of type "quiz".
         * By going through this handler, the widget will be able to determine that it has to render
         * the associated quiz and not the main content.
         *
         * @private
         * @param {*} ev
         */
        _onClickMiniQuiz: function (ev){
            var slideID = parseInt($(ev.currentTarget).data().slide_id);
            this.set('slideEntry',{
                slideID: slideID,
                isMiniQuiz: true
            });
            this.trigger_up('change_slide', this.get('slideEntry'));
        },
        /**
         * Handler called when the user clicks on a normal slide tab
         *
         * @private
         * @param {*} ev
         */
        _onClickTab: function (ev) {
            ev.stopPropagation();
            var $elem = $(ev.currentTarget);
            if ($elem.data('canAccess') === 'True') {
                var isQuiz = $elem.data('isQuiz');
                var isOra = $elem.data('isOra');
                var slideID = parseInt($elem.data('id'));
                var slide = findSlide(this.slideEntries, {id: slideID, isQuiz: isQuiz, isOra: isOra});
                this.set('slideEntry', slide);
            }
        },
        /**
         * Actively changes the active tab in the sidebar so that it corresponds
         * the slide currently displayed
         *
         * @private
         */
        _onChangeCurrentSlide: function () {
            var slide = this.get('slideEntry');
            this.$('.o_wslides_fs_sidebar_list_item.active').removeClass('active');
            var selector = '.o_wslides_fs_sidebar_list_item[data-id='+slide.id+'][data-is-quiz!="1"]';
    
            this.$(selector).addClass('active');
            this.$('.ora_tab.active').removeClass('active');
            this.trigger_up('change_slide', this.get('slideEntry'));
        },
    
        /**
         * Binds left and right arrow to allow the user to navigate between slides
         *
         * @param {*} ev
         * @private
         */
        _onKeyDown: function (ev){
            switch (ev.key){
                case "ArrowLeft":
                    this.goPrevious();
                    break;
                case "ArrowRight":
                    this.goNext();
                    break;
            }
        },
    });
    });