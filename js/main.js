// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeBtn = document.querySelector('.close-btn');

// 当前处理的图片数据
let currentFile = null;
let originalImageData = null;

// 初始化事件监听
function initializeEvents() {
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => fileInput.click());

    // 处理文件拖放
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    });

    // 处理文件选择
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // 处理质量滑块变化
    qualitySlider.addEventListener('input', (e) => {
        const quality = e.target.value / 100;
        qualityValue.textContent = `${e.target.value}%`;
        if (originalImageData) {
            compressImage(originalImageData, quality);
        }
    });

    // 处理下载按钮点击
    downloadBtn.addEventListener('click', downloadCompressedImage);

    // 处理图片点击放大
    originalImage.addEventListener('click', () => showModal(originalImage.src));
    compressedImage.addEventListener('click', () => showModal(compressedImage.src));

    // 处理模态框关闭
    closeBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // 处理 ESC 键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideModal();
        }
    });
}

// 显示模态框
function showModal(imageSrc) {
    modalImage.src = imageSrc;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
}

// 隐藏模态框
function hideModal() {
    modal.classList.remove('show');
    document.body.style.overflow = ''; // 恢复背景滚动
}

// 处理文件上传
function handleFile(file) {
    currentFile = file;
    
    // 显示原始文件大小
    originalSize.textContent = formatFileSize(file.size);

    // 预览原始图片
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        originalImageData = e.target.result;
        previewContainer.style.display = 'block';
        // 使用默认质量进行压缩
        compressImage(originalImageData, qualitySlider.value / 100);
    };
    reader.readAsDataURL(file);
}

// 压缩图片
function compressImage(imageData, quality) {
    // 创建图片对象
    const img = new Image();
    
    // 图片加载完成后执行压缩
    img.onload = function() {
        // 创建画布
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 获取原始尺寸
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        // 计算压缩后的尺寸 - 使用更智能的尺寸计算
        let width = originalWidth;
        let height = originalHeight;
        
        // 智能尺寸调整 - 只在图片非常大时才缩小
        const maxDimension = 2000; // 最大尺寸阈值
        if (width > maxDimension || height > maxDimension) {
            if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
            } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
            }
        }
        
        // 设置画布尺寸
        canvas.width = width;
        canvas.height = height;
        
        // 使用高质量的图像渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 在画布上绘制图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 获取压缩后的图片数据
        let compressedDataUrl;
        
        // 根据图片类型选择压缩方式
        if (currentFile.type === 'image/jpeg' || currentFile.type === 'image/jpg') {
            // 对于 JPEG 图片，使用较高的默认质量
            const jpegQuality = Math.max(0.6, quality); // 确保最小质量为 0.6
            compressedDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
        } else if (currentFile.type === 'image/png') {
            // 对于 PNG 图片，使用不同的压缩级别
            // PNG 不支持质量参数，但我们可以通过调整尺寸来实现压缩
            const pngQuality = Math.max(0.1, quality); // 确保最小质量为 0.1
            const pngWidth = Math.round(width * pngQuality);
            const pngHeight = Math.round(height * pngQuality);
            
            // 创建新的画布进行 PNG 压缩
            const pngCanvas = document.createElement('canvas');
            const pngCtx = pngCanvas.getContext('2d');
            pngCanvas.width = pngWidth;
            pngCanvas.height = pngHeight;
            pngCtx.drawImage(canvas, 0, 0, pngWidth, pngHeight);
            
            compressedDataUrl = pngCanvas.toDataURL('image/png');
        } else {
            // 默认使用 JPEG 格式，保持较高质量
            const defaultQuality = Math.max(0.6, quality);
            compressedDataUrl = canvas.toDataURL('image/jpeg', defaultQuality);
        }
        
        // 更新压缩后的图片
        compressedImage.src = compressedDataUrl;
        
        // 计算压缩后的大小
        const base64String = compressedDataUrl.split(',')[1];
        const compressedSize = Math.ceil((base64String.length * 3) / 4);
        document.getElementById('compressedSize').textContent = formatFileSize(compressedSize);
        
        console.log('压缩质量:', quality, '压缩后大小:', formatFileSize(compressedSize));
    };
    
    // 设置图片源
    img.src = imageData;
}

// 下载压缩后的图片
function downloadCompressedImage() {
    const link = document.createElement('a');
    link.download = `compressed_${currentFile.name}`;
    link.href = compressedImage.src;
    link.click();
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 初始化应用
initializeEvents(); 