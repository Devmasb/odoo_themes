odoo.define('website_ora_elearning.website_ora', function (require) {
    'use strict';
    
    var publicWidget = require('web.public.widget');
    var wysiwygLoader = require('web_editor.loader');
    var core = require('web.core');
    var _lt = core._lt;
    
    
    publicWidget.registry.websiteORA = publicWidget.Widget.extend({
        selector: '.o_user_response',
        read_events: {
            'click .o_slide_submit_btn': '_onSubmitClick',
        },
        /**
         * @override
         */
        start: function () {
            var def = this._super.apply(this, arguments);
            if (this.editableMode) {
                return def;
            }
            var self = this;
            _.each($('textarea.o_wysiwyg_loader'), async function (textarea) {
                var $textarea = $(textarea);
                self._wysiwyg = await wysiwygLoader.loadFromTextarea(self, $textarea[0], {
                    resizable: true,
                    userGeneratedContent: true,
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
            return Promise.all([def]);
        },
        /**
         * @private
         */
         _onSubmitClick: function () {
            if (this._wysiwyg) {
                this._wysiwyg.save();
            }
        },
    });
    });