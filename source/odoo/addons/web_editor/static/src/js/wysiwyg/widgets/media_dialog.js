odoo.define('wysiwyg.widgets.MediaDialog', function (require) {
'use strict';

var core = require('web.core');
var MediaModules = require('wysiwyg.widgets.media');
var Dialog = require('wysiwyg.widgets.Dialog');

var _t = core._t;

/**
 * Lets the user select a media. The media can be existing or newly uploaded.
 *
 * The media can be one of the following types: image, document, video or
 * font awesome icon (only existing icons).
 *
 * The user may change a media into another one depending on the given options.
 */
var MediaDialog = Dialog.extend({
    template: 'wysiwyg.widgets.media',
    xmlDependencies: Dialog.prototype.xmlDependencies.concat(
        ['/web_editor/static/src/xml/wysiwyg.xml']
    ),
    events: _.extend({}, Dialog.prototype.events, {
        'click #editor-media-image-tab': '_onClickImageTab',
        'click #editor-media-document-tab': '_onClickDocumentTab',
        'click #editor-media-icon-tab': '_onClickIconTab',
        'click #editor-media-video-tab': '_onClickVideoTab',
    }),
    custom_events: _.extend({}, Dialog.prototype.custom_events || {}, {
        save_request: '_onSaveRequest',
    }),

    /**
     * @constructor
     * @param {Element} media
     */
    init: function (parent, options, media) {
        var $media = $(media);

        options = _.extend({}, options);
        options.noDocuments = options.onlyImages || options.noDocuments;
        options.noIcons = options.onlyImages || options.noIcons;
        options.noVideos = options.onlyImages || options.noVideos;

        this._super(parent, _.extend({}, {
            title: _t("Select a Media"),
            save_text: _t("Add"),
        }, options));

        this.trigger_up('getRecordInfo', {
            recordInfo: options,
            type: 'media',
            callback: function (recordInfo) {
                _.defaults(options, recordInfo);
            },
        });

        if (!options.noImages) {
            this.imageWidget = new MediaModules.ImageWidget(this, media, options);
        }
        if (!options.noDocuments) {
            this.documentWidget = new MediaModules.DocumentWidget(this, media, options);
        }
        if (!options.noIcons) {
            this.iconWidget = new MediaModules.IconWidget(this, media, options);
        }
        if (!options.noVideos) {
            this.videoWidget = new MediaModules.VideoWidget(this, media, options);
        }

        if (this.imageWidget && $media.is('img')) {
            this.activeWidget = this.imageWidget;
        } else if (this.documentWidget && $media.is('a.o_image')) {
            this.activeWidget = this.documentWidget;
        } else if (this.videoWidget && $media.hasClass('media_iframe_video')) {
            this.activeWidget = this.videoWidget;
        } else if (this.iconWidget && $media.is('span, i')) {
            this.activeWidget = this.iconWidget;
        } else if (this.imageWidget) {
            this.activeWidget = this.imageWidget;
        }
    },
    /**
     * Adds the appropriate class to the current modal and appends the media
     * widgets to their respective tabs.
     *
     * @override
     */
    start: function () {
        var promises = [this._super.apply(this, arguments)];
        this.$modal.find('.modal-dialog').addClass('o_select_media_dialog');

        if (this.imageWidget) {
            this.imageWidget.clear();
        }
        if (this.documentWidget) {
            this.documentWidget.clear();
        }
        if (this.iconWidget) {
            this.iconWidget.clear();
        }
        if (this.videoWidget) {
            this.videoWidget.clear();
        }

        if (this.imageWidget) {
            promises.push(this.imageWidget.appendTo(this.$("#editor-media-image")));
        }
        if (this.documentWidget) {
            promises.push(this.documentWidget.appendTo(this.$("#editor-media-document")));
        }
        if (this.iconWidget) {
            promises.push(this.iconWidget.appendTo(this.$("#editor-media-icon")));
        }
        if (this.videoWidget) {
            promises.push(this.videoWidget.appendTo(this.$("#editor-media-video")));
        }

        return Promise.all(promises);
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Returns whether the document widget is currently active.
     *
     * @returns {boolean}
     */
    isDocumentActive: function () {
        return this.activeWidget === this.documentWidget;
    },
    /**
     * Returns whether the icon widget is currently active.
     *
     * @returns {boolean}
     */
    isIconActive: function () {
        return this.activeWidget === this.iconWidget;
    },
    /**
     * Returns whether the image widget is currently active.
     *
     * @returns {boolean}
     */
    isImageActive: function () {
        return this.activeWidget === this.imageWidget;
    },
    /**
     * Returns whether the video widget is currently active.
     *
     * @returns {boolean}
     */
    isVideoActive: function () {
        return this.activeWidget === this.videoWidget;
    },
    /**
     * Saves the currently selected media from the currently active widget.
     *
     * The save event data `final_data` will be one Element in general, but it
     * will be an Array of Element if `multiImages` is set.
     *
     * @override
     */
    save: function () {
        var self = this;
        var _super = this._super;
        var args = arguments;
        return this.activeWidget.save().then(function (data) {
            self.final_data = data;
            return _super.apply(self, args);
        });
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * Sets the document widget as the active widget.
     *
     * @private
     */
    _onClickDocumentTab: function () {
        this.activeWidget = this.documentWidget;
    },
    /**
     * Sets the icon widget as the active widget.
     *
     * @private
     */
    _onClickIconTab: function () {
        this.activeWidget = this.iconWidget;
    },
    /**
     * Sets the image widget as the active widget.
     *
     * @private
     */
    _onClickImageTab: function () {
        this.activeWidget = this.imageWidget;
    },
    /**
     * Sets the video widget as the active widget.
     *
     * @private
     */
    _onClickVideoTab: function () {
        this.activeWidget = this.videoWidget;
    },
    /**
     * Handles save request from the child widgets.
     *
     * This is for usability, to allow the user to save from other ways than
     * click on the modal button, such as double clicking a media to select it.
     *
     * @private
     * @param {OdooEvent} ev
     */
    _onSaveRequest: function (ev) {
        ev.stopPropagation();
        this.save();
    },
});

return MediaDialog;
});
