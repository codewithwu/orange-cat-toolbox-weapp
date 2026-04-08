// 模板配置
const templates = [
  {
    id: 'template1',
    name: '简约白',
    background: '#ffffff',
    textColor: '#333333',
    fontSize: 32,
    lineHeight: 1.6,
    padding: 40,
    borderRadius: 24,
    shadow: { blur: 10, offsetX: 0, offsetY: 4, color: 'rgba(0,0,0,0.1)' },
    previewStyle: 'background:#ffffff;box-shadow:0 4rpx 20rpx rgba(0,0,0,0.1);',
    previewTextStyle: 'color:#333333;font-size:24rpx;'
  },
  {
    id: 'template2',
    name: '暖色渐变',
    background: 'linear-gradient(135deg, #ff9a56 0%, #ff6a8a 100%)',
    textColor: '#4a4a4a',
    fontSize: 32,
    lineHeight: 1.6,
    padding: 40,
    borderRadius: 24,
    shadow: { blur: 15, offsetX: 0, offsetY: 6, color: 'rgba(255,107,138,0.3)' },
    previewStyle: 'background:linear-gradient(135deg, #ff9a56 0%, #ff6a8a 100%);box-shadow:0 6rpx 24rpx rgba(255,107,138,0.3);',
    previewTextStyle: 'color:#4a4a4a;font-size:24rpx;'
  },
  {
    id: 'template3',
    name: '深色模式',
    background: '#1a1a2e',
    textColor: '#e8e8e8',
    fontSize: 32,
    lineHeight: 1.6,
    padding: 40,
    borderRadius: 24,
    shadow: { blur: 20, offsetX: 0, offsetY: 8, color: 'rgba(0,0,0,0.4)' },
    previewStyle: 'background:#1a1a2e;box-shadow:0 8rpx 32rpx rgba(0,0,0,0.4);',
    previewTextStyle: 'color:#e8e8e8;font-size:24rpx;'
  }
];

// 历史记录存储键名
const HISTORY_KEY = 'card_history';

Page({
  data: {
    text: '',
    currentTemplateId: 'template1',
    templates: templates,
    showHistory: false,
    historyList: [],
    historyCount: 0,
    saving: false,
    currentTemplateStyle: '',
    currentTextStyle: ''
  },

  onLoad() {
    this.loadHistory();
    // 设置默认文字
    this.setData({ text: '文字转精美图片，让你的分享更出彩' });
    // 初始化预览样式
    this.updatePreviewStyle();
  },

  // 更新预览样式
  updatePreviewStyle() {
    const style = this.getCurrentTemplateStyle();
    const textStyle = this.getCurrentTextStyle();
    this.setData({
      currentTemplateStyle: style,
      currentTextStyle: textStyle
    });
  },

  // 文字输入
  handleTextInput(e) {
    this.setData({ text: e.detail.value });
  },

  // 清空文字
  handleClear() {
    this.setData({ text: '' });
  },

  // 粘贴文字
  handlePaste() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          const currentText = this.data.text;
          const newText = currentText + res.data;
          if (newText.length <= 200) {
            this.setData({ text: newText });
          } else {
            wx.showToast({ title: '超出字数限制', icon: 'none' });
          }
        }
      }
    });
  },

  // 复制文字
  handleCopy() {
    if (!this.data.text) {
      wx.showToast({ title: '无文字可复制', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.text,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 选择模板
  handleTemplateSelect(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ currentTemplateId: id });
    this.updatePreviewStyle();
  },

  // 获取当前模板
  getCurrentTemplate() {
    return this.data.templates.find(t => t.id === this.data.currentTemplateId) || this.data.templates[0];
  },

  // 获取当前模板的卡片样式
  getCurrentTemplateStyle() {
    const tpl = this.getCurrentTemplate();
    const shadow = tpl.shadow;
    return `background:${tpl.background};border-radius:${tpl.borderRadius}rpx;box-shadow:${shadow.blur}rpx ${shadow.offsetX}rpx ${shadow.offsetY}rpx ${shadow.color};`;
  },

  // 获取当前模板的文字样式
  getCurrentTextStyle() {
    const tpl = this.getCurrentTemplate();
    return `color:${tpl.textColor};font-size:${tpl.fontSize}rpx;line-height:${tpl.lineHeight};`;
  },

  // 保存到相册
  handleSave() {
    if (!this.data.text.trim()) {
      wx.showToast({ title: '请输入文字', icon: 'none' });
      return;
    }

    if (this.data.saving) return;

    this.setData({ saving: true });

    // 保存历史记录
    this.saveToHistory();

    // 使用 canvas 生成图片
    this.generateCardImage();
  },

  // 生成卡片图片
  generateCardImage() {
    const tpl = this.getCurrentTemplate();
    const text = this.data.text;

    // 创建 canvas
    const ctx = wx.createCanvasContext('cardCanvas');
    const canvasWidth = 600;
    const canvasHeight = 800;
    const padding = tpl.padding * 2;
    const contentWidth = canvasWidth - padding;

    // 先绘制阴影效果
    ctx.setShadow(tpl.shadow.blur, tpl.shadow.offsetX, tpl.shadow.offsetY, tpl.shadow.color);

    // 绘制背景
    if (tpl.background.includes('gradient')) {
      const grd = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      grd.addColorStop(0, '#ff9a56');
      grd.addColorStop(1, '#ff6a8a');
      ctx.setFillStyle(grd);
    } else {
      ctx.setFillStyle(tpl.background);
    }

    // 圆角矩形背景
    this.drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, tpl.borderRadius);
    ctx.fill();

    // 重置阴影
    ctx.setShadow(0, 0, 0, 'transparent');

    // 绘制文字
    ctx.setFillStyle(tpl.textColor);
    ctx.setFontSize(tpl.fontSize);

    const lines = this.wrapText(ctx, text, contentWidth);
    const lineHeight = tpl.fontSize * tpl.lineHeight;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (canvasHeight - totalTextHeight) / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, padding / 2, startY + (index + 1) * lineHeight);
    });

    ctx.draw();

    // 导出图片
    setTimeout(() => {
      wx.canvasToTempFilePath({
        canvasId: 'cardCanvas',
        success: (res) => {
          this.saveToAlbum(res.tempFilePath);
        },
        fail: (err) => {
          console.error('canvasToTempFilePath error:', err);
          this.setData({ saving: false });
          wx.showToast({ title: '生成图片失败', icon: 'none' });
        }
      });
    }, 500);
  },

  // 绘制圆角矩形
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  // 文字换行
  wrapText(ctx, text, maxWidth) {
    const chars = text.split('');
    let line = '';
    let lines = [];
    let currentWidth = 0;

    for (let char of chars) {
      const testLine = line + char;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && line) {
        lines.push(line);
        line = char;
        currentWidth = ctx.measureText(char).width;
      } else {
        line = testLine;
        currentWidth = testWidth;
      }
    }

    if (line) {
      lines.push(line);
    }

    return lines;
  },

  // 保存到相册
  saveToAlbum(tempFilePath) {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        this.setData({ saving: false });
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: (err) => {
        this.setData({ saving: false });
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存图片到相册',
            confirmText: '去授权',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  // 保存到历史记录
  saveToHistory() {
    const tpl = this.getCurrentTemplate();
    const record = {
      id: Date.now(),
      text: this.data.text,
      templateId: this.data.currentTemplateId,
      templateName: tpl.name,
      previewStyle: tpl.previewStyle,
      textStyle: tpl.previewTextStyle,
      date: new Date().toLocaleDateString()
    };

    let history = wx.getStorageSync(HISTORY_KEY) || [];
    history.unshift(record);

    // 最多保存20条
    if (history.length > 20) {
      history = history.slice(0, 20);
    }

    wx.setStorageSync(HISTORY_KEY, history);
    this.loadHistory();
  },

  // 加载历史记录
  loadHistory() {
    const history = wx.getStorageSync(HISTORY_KEY) || [];
    this.setData({
      historyList: history,
      historyCount: history.length
    });
  },

  // 显示历史记录
  handleShowHistory() {
    this.setData({ showHistory: true });
  },

  // 关闭历史记录
  handleCloseHistory() {
    this.setData({ showHistory: false });
  },

  // 阻止事件冒泡
  stopBubble() {},

  // 选择历史记录
  handleHistorySelect(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.historyList[index];

    this.setData({
      text: record.text,
      currentTemplateId: record.templateId,
      showHistory: false
    });

    // 更新预览样式
    this.updatePreviewStyle();
  }
});