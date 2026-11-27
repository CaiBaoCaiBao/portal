export const VARIANT_IMAGE_PURPOSE = [
    "thumbnail", // 缩略图
    "preview_gif", // 预览 GIF
    "preview_webp", // 预览 WebP
] as const;

export const VARIANT_AV_PURPOSE = [
    "transcode_vedio", // 视频转码
    "hls_stream", // HLS 切片流
    "audio_track", // 音频轨道
    "waveform", // 波形图
    "sprite_sheet", // 进度条预览
] as const;

export const VARIANT_DOC_PURPOSE = [
    "preview_pdf", // 预览 PDF
] as const;

export const DOCUMENT_MIME = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/csv",
] as const;

export const DOCUMENT_EXT: Record<string, string> = {
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/csv": "csv",
};