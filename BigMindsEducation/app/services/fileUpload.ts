// File Upload Service for BigMinds Education App
// Handles file uploads, image compression, and document management

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { backendAPI } from './backendAPI';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
  uploadedAt: string;
  category: 'image' | 'document' | 'video' | 'audio';
}

interface UploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  compressImages?: boolean;
  quality?: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
}

class FileUploadService {
  private static instance: FileUploadService;
  private uploadQueue: Array<{
    id: string;
    file: File | any;
    options: UploadOptions;
    onProgress?: (progress: UploadProgress) => void;
    onSuccess?: (file: UploadedFile) => void;
    onError?: (error: string) => void;
  }> = [];
  private isUploading = false;

  // Default upload options
  private defaultOptions: UploadOptions = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'application/pdf', 'text/*'],
    compressImages: true,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
  };

  private constructor() {}

  static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  // Pick image from gallery or camera
  async pickImage(options: {
    source: 'gallery' | 'camera';
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }): Promise<UploadedFile | null> {
    try {
      // Request permissions
      // const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      // if (permissionResult.granted === false) {
      //   throw new Error('Permission to access camera roll is required!');
      // }

      let result: ImagePicker.ImagePickerResult | undefined;
      if (options.source === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.granted === false) {
          throw new Error('Permission to access camera is required!');
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: options.allowsEditing || true,
          aspect: options.aspect || [4, 3],
          quality: options.quality || 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: options.allowsEditing || true,
          aspect: options.aspect || [4, 3],
          quality: options.quality || 0.8,
        });
      }

      if (result && !result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return await this.processImage(asset);
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  // Pick multiple images
  async pickMultipleImages(options: {
    maxCount?: number;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }): Promise<UploadedFile[]> {
    try {
      // const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      // if (permissionResult.granted === false) {
      //   throw new Error('Permission to access camera roll is required!');
      // }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || false,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
        allowsMultipleSelection: true,
        selectionLimit: options.maxCount || 10,
      });

      if (!result.canceled && result.assets) {
        const uploadedFiles: UploadedFile[] = [];
        
        for (const asset of result.assets) {
          try {
            const file = await this.processImage(asset);
            if (file) {
              uploadedFiles.push(file);
            }
          } catch (error) {
            console.error('Error processing image:', error);
          }
        }

        return uploadedFiles;
      }

      return [];
    } catch (error) {
      console.error('Error picking multiple images:', error);
      throw error;
    }
  }

  // Pick document
  async pickDocument(options: {
    type?: string[];
    copyToCacheDirectory?: boolean;
  }): Promise<UploadedFile | null> {
    try {
      // const result = await DocumentPicker.getDocumentAsync({
      //   type: options.type || ['*/*'],
      //   copyToCacheDirectory: options.copyToCacheDirectory || true,
      // });

      // TODO: Uncomment when DocumentPicker is properly configured
      // const result = await DocumentPicker.getDocumentAsync({
      //   type: options.type || ['*/*'],
      //   copyToCacheDirectory: options.copyToCacheDirectory || true,
      // });
      
      // if (!result.canceled && result.assets && result.assets[0]) {
      //   const asset = result.assets[0];
      //   return await this.processDocument(asset);
      // }

      return null;

      return null;
    } catch (error) {
      console.error('Error picking document:', error);
      throw error;
    }
  }

  // Process image file
  private async processImage(asset: ImagePicker.ImagePickerAsset): Promise<UploadedFile> {
    // const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    
    // if (!fileInfo.exists) {
    //   throw new Error('File does not exist');
    // }

    // // Validate file size
    // if (fileInfo.size && fileInfo.size > this.defaultOptions.maxSize!) {
    //   throw new Error(`File size exceeds ${this.defaultOptions.maxSize! / (1024 * 1024)}MB limit`);
    // }

    // // Compress image if needed
    // let processedUri = asset.uri;
    // if (this.defaultOptions.compressImages) {
    //   processedUri = await this.compressImage(asset.uri);
    // }

    // // Generate thumbnail
    // const thumbnail = await this.generateThumbnail(asset.uri);

    // // Upload file
    // const uploadedFile = await this.uploadFile({
    //   uri: processedUri,
    //   name: asset.fileName || `image_${Date.now()}.jpg`,
    //   type: 'image/jpeg',
    //   size: fileInfo.size || 0,
    // });

    // return {
    //   ...uploadedFile,
    //   thumbnail,
    //   category: 'image' as const,
    // };
    return {
      id: Date.now().toString(),
      name: asset.fileName || `image_${Date.now()}.jpg`,
      size: 0, // Placeholder, actual size will be fetched
      type: 'image/jpeg', // Placeholder, actual type will be fetched
      url: `https://api.bigminds.education/files/${Date.now()}`, // Mock URL
      uploadedAt: new Date().toISOString(),
      category: 'image' as const,
    };
  }

  // Process document file
  private async processDocument(asset: DocumentPicker.DocumentPickerAsset): Promise<UploadedFile> {
    // const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    
    // if (!fileInfo.exists) {
    //   throw new Error('File does not exist');
    // }

    // // Validate file size
    // if (fileInfo.size && fileInfo.size > this.defaultOptions.maxSize!) {
    //   throw new Error(`File size exceeds ${this.defaultOptions.maxSize! / (1024 * 1024)}MB limit`);
    // }

    // // Determine file category
    // const category = this.getFileCategory(asset.mimeType || '');

    // // Upload file
    // const uploadedFile = await this.uploadFile({
    //   uri: asset.uri,
    //   name: asset.name,
    //   type: asset.mimeType || 'application/octet-stream',
    //   size: fileInfo.size || 0,
    // });

    // return {
    //   ...uploadedFile,
    //   category,
    // };
    return {
      id: Date.now().toString(),
      name: asset.name || `document_${Date.now()}.pdf`,
      size: 0, // Placeholder, actual size will be fetched
      type: 'application/pdf', // Placeholder, actual type will be fetched
      url: `https://api.bigminds.education/files/${Date.now()}`, // Mock URL
      uploadedAt: new Date().toISOString(),
      category: 'document' as const,
    };
  }

  // Compress image
  private async compressImage(uri: string): Promise<string> {
    try {
      // In a real app, you'd use a proper image compression library
      // For now, we'll return the original URI
      console.log('Image compression would happen here');
      return uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  }

  // Generate thumbnail
  private async generateThumbnail(uri: string): Promise<string> {
    try {
      // In a real app, you'd generate a proper thumbnail
      // For now, we'll return the original URI
      console.log('Thumbnail generation would happen here');
      return uri;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return uri;
    }
  }

  // Upload file to server
  private async uploadFile(file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  }): Promise<UploadedFile> {
    // In a real app, you'd upload to your server
    // For demo purposes, we'll simulate the upload
    
    const uploadId = Date.now().toString();
    
    // Simulate upload progress
    await this.simulateUploadProgress(uploadId);
    
    const uploadedFile: UploadedFile = {
      id: uploadId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: `https://api.bigminds.education/files/${uploadId}`, // Mock URL
      uploadedAt: new Date().toISOString(),
      category: 'document' as const,
    };

    return uploadedFile;
  }

  // Simulate upload progress
  private async simulateUploadProgress(uploadId: string): Promise<void> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        
        // Emit progress event
        this.emit('upload_progress', {
          uploadId,
          loaded: progress,
          total: 100,
          percentage: progress,
        });
      }, 200);
    });
  }

  // Get file category
  private getFileCategory(mimeType: string): 'image' | 'document' | 'video' | 'audio' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  // Upload file with progress tracking
  async uploadFileWithProgress(
    file: File | any,
    options: UploadOptions = {},
    onProgress?: (progress: UploadProgress) => void,
    onSuccess?: (file: UploadedFile) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    const uploadId = Date.now().toString();
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Add to upload queue
    this.uploadQueue.push({
      id: uploadId,
      file,
      options: mergedOptions,
      onProgress,
      onSuccess,
      onError,
    });

    // Start processing queue
    this.processUploadQueue();
  }

  // Process upload queue
  private async processUploadQueue(): Promise<void> {
    if (this.isUploading || this.uploadQueue.length === 0) {
      return;
    }

    this.isUploading = true;

    while (this.uploadQueue.length > 0) {
      const upload = this.uploadQueue.shift();
      if (!upload) continue;

      try {
        // Process the upload
        const uploadedFile = await this.processUpload(upload);
        
        if (upload.onSuccess) {
          upload.onSuccess(uploadedFile);
        }
      } catch (error) {
        console.error('Upload error:', error);
        
        if (upload.onError) {
          upload.onError(error instanceof Error ? error.message : 'Upload failed');
        }
      }
    }

    this.isUploading = false;
  }

  // Process individual upload
  private async processUpload(upload: {
    id: string;
    file: File | any;
    options: UploadOptions;
    onProgress?: (progress: UploadProgress) => void;
  }): Promise<UploadedFile> {
    // Simulate file processing and upload
    const totalSize = upload.file.size || 1024 * 1024; // 1MB default
    
    for (let loaded = 0; loaded <= totalSize; loaded += totalSize / 10) {
      const progress: UploadProgress = {
        loaded: Math.min(loaded, totalSize),
        total: totalSize,
        percentage: (loaded / totalSize) * 100,
      };

      if (upload.onProgress) {
        upload.onProgress(progress);
      }

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Return mock uploaded file
    return {
      id: upload.id,
      name: upload.file.name || 'uploaded_file',
      size: totalSize,
      type: upload.file.type || 'application/octet-stream',
      url: `https://api.bigminds.education/files/${upload.id}`,
      uploadedAt: new Date().toISOString(),
      category: 'document' as const,
    };
  }

  // Delete uploaded file
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // In a real app, you'd delete from your server
      console.log(`Deleting file: ${fileId}`);
      
      // Simulate deletion delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Get file info
  async getFileInfo(fileId: string): Promise<UploadedFile | null> {
    try {
      // In a real app, you'd fetch from your server
      // For demo, return mock data
      return {
        id: fileId,
        name: 'sample_file.pdf',
        size: 1024 * 1024, // 1MB
        type: 'application/pdf',
        url: `https://api.bigminds.education/files/${fileId}`,
        uploadedAt: new Date().toISOString(),
        category: 'document' as const,
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }

  // Event listeners
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in file upload event callback:', error);
        }
      });
    }
  }

  // Get upload queue status
  getUploadQueueStatus(): {
    isUploading: boolean;
    queueLength: number;
  } {
    return {
      isUploading: this.isUploading,
      queueLength: this.uploadQueue.length,
    };
  }

  // Clear upload queue
  clearUploadQueue(): void {
    this.uploadQueue = [];
  }
}

export async function uploadImage(file: { uri: string; name: string; type: string; }): Promise<{ path: string; filename: string; url: string; }> {
  try {
    const form = new FormData();
    // @ts-ignore - React Native FormData file
    form.append('image', { uri: file.uri, name: file.name, type: file.type });
    const res = await backendAPI.post('/upload/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    const data = res.data.data;
    return { path: data.path, filename: data.filename, url: data.path };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to upload image. Please check file size and format.');
  }
}

export async function uploadDocument(file: { uri: string; name: string; type: string; }): Promise<{ path: string; filename: string; url: string; }> {
  try {
    const form = new FormData();
    // @ts-ignore
    form.append('document', { uri: file.uri, name: file.name, type: file.type });
    const res = await backendAPI.post('/upload/document', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    const data = res.data.data;
    return { path: data.path, filename: data.filename, url: data.path };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to upload document. Please ensure it is a valid format.');
  }
}

export async function uploadVideo(file: { uri: string; name: string; type: string; }): Promise<{ path: string; filename: string; url: string; }> {
  try {
    const form = new FormData();
    // @ts-ignore
    form.append('video', { uri: file.uri, name: file.name, type: file.type });
    const res = await backendAPI.post('/upload/video', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    const data = res.data.data;
    return { path: data.path, filename: data.filename, url: data.path };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to upload video. Please check the file size limits.');
  }
}

// Create and export a singleton instance
export const fileUploadService = FileUploadService.getInstance();

// Export types for use in components
export type { UploadProgress, UploadedFile, UploadOptions }; 