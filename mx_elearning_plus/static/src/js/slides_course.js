odoo.define('mx_elearning_plus.extended', function (require) {
    'use strict';
    var Fullscreen = require('@website_slides/js/slides_course_fullscreen_player')[Symbol.for("default")];
    var core = require('web.core');
    var _t = core._t;
    
    Fullscreen.include({
        events: _.extend({}, Fullscreen.prototype.events, {
            'click .o_btn_comment_unable': '_onClickCommentUnable',
            'click .o_btn_comment_public': '_onClickCommentPublic',
            'click .o_btn_no_comment_karma': '_onClickNoCommentKarma',
            'click .o_btn_comment_karma': '_onClickCommentKarma',
        }),

        _onClickCommentUnable: function () {
            var message = ('Commenting is not enabled on this course.');
            this.displayNotification({
                type: 'warning',
                message: message,
                sticky: true
            });
        },

        _onClickCommentPublic: function () {
            var message = ('There are no comments for now. Join Course to be the first to leave a comment.');
            this.displayNotification({
                type: 'warning',
                message: message,
                sticky: true
            });
        },

        _onClickNoCommentKarma: function () {
            var message = ('There are no comments for now. Earn more Karma to be the first to leave a comment.');
            this.displayNotification({
                type: 'warning',
                message: message,
                sticky: true
            });
        },

        _onClickCommentKarma: function () {
            var message = ('Earn more Karma to leave a comment.');
            this.displayNotification({
                type: 'warning',
                message: message,
                sticky: true
            });
        },
        
        _renderSlide: function () {
            this._super.apply(this, arguments);
            var slide = this.get('slide');
            this._rpc({
                route: '/slides/slide/mx/like',
                params: {
                    slide_id: slide.id,
                },
            }).then(function (data) {
                if (! data.error) {
                    const $likesBtn = self.$('span.o_wslides_js_slide_like_up_mx');
                    const $likesIcon = $likesBtn.find('i.fa');
                    const $dislikesBtn = self.$('span.o_wslides_js_slide_like_down_mx');
                    const $dislikesIcon = $dislikesBtn.find('i.fa');
    
                    // update 'thumbs-up' button with latest state
                    $likesBtn.data('user-vote', data.user_vote);
                    $likesBtn.find('span').text(data.likes);
                    $likesIcon.toggleClass("fa-thumbs-up", data.user_vote === 1);
                    $likesIcon.toggleClass("fa-thumbs-o-up", data.user_vote !== 1);
                    // update 'thumbs-down' button with latest state
                    $dislikesBtn.data('user-vote', data.user_vote);
                    $dislikesBtn.find('span').text(data.dislikes);
                    $dislikesIcon.toggleClass("fa-thumbs-down", data.user_vote === -1);
                    $dislikesIcon.toggleClass("fa-thumbs-o-down", data.user_vote !== -1);
                    $('.o_wslides_js_slide_like_up_mx').data('slide-id', slide.id);
                    $('.o_wslides_js_slide_like_down_mx').data('slide-id', slide.id);
                    $('.o_wslides_js_slide_like_up_mx span').text(data.likes);
                    $('.o_wslides_js_slide_like_down_mx span').text(data.dislikes);
                }
            });
        },

        _onChangeSlideRequest: function (ev){
            this._super.apply(this, arguments);
            var slideData = ev.data;
            var $data = this.$el.prevObject.find('.js_publish_btn:visible').parents(".js_publish_management:first");
            this._rpc({
                route: '/website/publish/slide',
                params: {
                    id: slideData.id,
                },
            })
            .then(function (result) {
                if (result){
                    $data.removeClass("css_unpublished");
                    $data.addClass("css_published");
                    $data.find('input').prop("checked", result);
                    $data.parents("[data-publish]").attr("data-publish", +result ? 'on' : 'off');
                }else{
                    $data.removeClass("css_published");
                    $data.addClass("css_unpublished");
                    $data.find('input').prop("checked", result);
                    $data.parents("[data-publish]").attr("data-publish", +result ? 'on' : 'off');
                }
            })
        }
    });
});