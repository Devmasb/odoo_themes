odoo.define('slide.comment.composer.fullscreen', function (require) {
    'use strict';
    
    const publicWidget = require('web.public.widget');
    const session = require('web.session');
    const portalComposer = require('portal.composer');
    const {_t, qweb} = require('web.core');
    
    const PortalComposer = portalComposer.PortalComposer;
    
    
    PortalComposer.include({
        /**
     * @private
     * @param {Event} ev
     */
    _onSubmitButtonClick: function (ev) {
        return this._super(...arguments).then((result) => {
            const $modal = this.$el.closest('#commentpopupcomposer');
            $modal.on('hidden.bs.modal', () => {
                this.trigger_up('reload_comment_popup_composer', result);
            });
            $modal.modal('hide');
        });
    },
    
    _prepareMessageData: function () {
        if (this.options.is_comment_fullscreen){
            var res_id = $('.o_wslides_fs_sidebar_list_item.active').data('id');
            return Object.assign(this.options || {}, {
                'message': this.$('textarea[name="message"]').val(),
                'attachment_ids': _.pluck(this.attachments, 'id'),
                'attachment_tokens': _.pluck(this.attachments, 'access_token'),
                'res_id': res_id,
            });
        }
        else{
            return Object.assign(this.options || {}, {
                'message': this.$('textarea[name="message"]').val(),
                'attachment_ids': _.pluck(this.attachments, 'id'),
                'attachment_tokens': _.pluck(this.attachments, 'access_token'),
            });
        }
    },

    });
    /**
     * CommentPopupComposer
     *
     * Open a popup with the portal composer when clicking on it.
     **/
    const CommentPopupComposer = publicWidget.Widget.extend({
        selector: '.o_comment_popup_composer',
        custom_events: {
            reload_comment_popup_composer: '_onReloadCommentPopupComposer',
        },
    
        willStart: function (parent) {
            const def = this._super.apply(this, arguments);
    
            const options = this.$el.data();
        
            this.options = _.defaults({}, options, {
                'allow_composer': true,
                'display_composer': false,
                'csrf_token': odoo.csrf_token,
                'token': false,
                'res_model': false,
                'res_id': false,
                    });
            this.attachments = [];
    
            return def;
        },
    
        /**
         * @override
         */
        start: function () {
            return Promise.all([
                this._super.apply(this, arguments),
                this._reloadCommentPopupComposer(),
            ]);
        },
    
        /**
         * Destroy existing commentPopup and insert new commentPopup widget
         *
         * @private
         * @param {Object} data
         */
        _reloadCommentPopupComposer: function () {
            // Append the modal
            const modal = qweb.render(
                'mx_elearning_plus.PopupCommentComposer', {
                inline_mode: true,
                widget: this,
            });
            this.$('.o_comment_popup_composer_modal').html(modal);
    
            if (this._composer) {
                this._composer.destroy();
            }
    
            // Instantiate the "Portal Composer" widget and insert it into the modal
            this._composer = new PortalComposer(this, this.options);
            return this._composer.appendTo(this.$('.o_comment_popup_composer_modal .o_portal_chatter_composer')).then(() => {
            });
        },
    
        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------
    
        /**
         * @private
         * @param {OdooEvent} event
         */
        _onReloadCommentPopupComposer: function (event) {
            const data = event.data;
            this.options = _.extend(this.options, data);
    
            this._reloadCommentPopupComposer();
        }
    });
    
    publicWidget.registry.CommentPopupComposer = CommentPopupComposer;
    
    return CommentPopupComposer;
    
    });
