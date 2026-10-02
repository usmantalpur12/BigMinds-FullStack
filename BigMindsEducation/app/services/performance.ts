// Performance Optimization Service for BigMinds Education App
// Handles performance monitoring, caching, and optimization

interface PerformanceMetrics {
  appStartTime: number;
  screenLoadTimes: { [screenName: string]: number };
  apiResponseTimes: { [endpoint: string]: number[] };
  memoryUsage: number;
  renderTimes: { [componentName: string]: number[] };
  errorCount: number;
  crashCount: number;
}

interface CacheConfig {
  maxSize: number; // in MB
  maxAge: number; // in milliseconds
  cleanupInterval: number; // in milliseconds
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics = {
    appStartTime: 0,
    screenLoadTimes: {},
    apiResponseTimes: {},
    memoryUsage: 0,
    renderTimes: {},
    errorCount: 0,
    crashCount: 0,
  };
  private cache: Map<string, { data: any; timestamp: number; size: number }> = new Map();
  private cacheConfig: CacheConfig = {
    maxSize: 50, // 50MB
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000, // 1 hour
  };
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.initializePerformanceMonitoring();
    this.startCacheCleanup();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    // Record app start time
    this.metrics.appStartTime = Date.now();
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Start error monitoring
    this.startErrorMonitoring();
    
    console.log('Performance monitoring initialized');
  }

  // Start memory monitoring
  private startMemoryMonitoring(): void {
    setInterval(() => {
      // In a real app, you'd use a proper memory monitoring library
      // For now, we'll simulate memory usage
      this.metrics.memoryUsage = Math.random() * 100; // 0-100 MB
      
      // Emit memory usage event
      this.emit('memory_usage', {
        usage: this.metrics.memoryUsage,
        timestamp: Date.now(),
      });
      
      // Check for memory warnings
      if (this.metrics.memoryUsage > 80) {
        this.emit('memory_warning', {
          usage: this.metrics.memoryUsage,
          timestamp: Date.now(),
        });
      }
    }, 30000); // Check every 30 seconds
  }

  // Start error monitoring
  private startErrorMonitoring(): void {
    // Monitor unhandled errors
    const originalErrorHandler = ErrorUtils.getGlobalHandler?.();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      this.metrics.errorCount++;
      
      if (isFatal) {
        this.metrics.crashCount++;
      }
      
      this.emit('error', {
        error: error.message,
        stack: error.stack,
        isFatal,
        timestamp: Date.now(),
      });
      
      // Call original handler if it exists
      if (originalErrorHandler && typeof originalErrorHandler === 'function') {
        (originalErrorHandler as any)(error, isFatal);
      }
    });
  }

  // Record screen load time
  recordScreenLoadTime(screenName: string, loadTime: number): void {
    this.metrics.screenLoadTimes[screenName] = loadTime;
    
    this.emit('screen_load', {
      screenName,
      loadTime,
      timestamp: Date.now(),
    });
    
    // Check for slow screen loads
    if (loadTime > 3000) { // 3 seconds
      this.emit('slow_screen_load', {
        screenName,
        loadTime,
        timestamp: Date.now(),
      });
    }
  }

  // Record API response time
  recordApiResponseTime(endpoint: string, responseTime: number): void {
    if (!this.metrics.apiResponseTimes[endpoint]) {
      this.metrics.apiResponseTimes[endpoint] = [];
    }
    
    this.metrics.apiResponseTimes[endpoint].push(responseTime);
    
    // Keep only last 100 responses
    if (this.metrics.apiResponseTimes[endpoint].length > 100) {
      this.metrics.apiResponseTimes[endpoint].shift();
    }
    
    this.emit('api_response', {
      endpoint,
      responseTime,
      timestamp: Date.now(),
    });
    
    // Check for slow API responses
    if (responseTime > 5000) { // 5 seconds
      this.emit('slow_api_response', {
        endpoint,
        responseTime,
        timestamp: Date.now(),
      });
    }
  }

  // Record component render time
  recordRenderTime(componentName: string, renderTime: number): void {
    if (!this.metrics.renderTimes[componentName]) {
      this.metrics.renderTimes[componentName] = [];
    }
    
    this.metrics.renderTimes[componentName].push(renderTime);
    
    // Keep only last 50 renders
    if (this.metrics.renderTimes[componentName].length > 50) {
      this.metrics.renderTimes[componentName].shift();
    }
    
    this.emit('component_render', {
      componentName,
      renderTime,
      timestamp: Date.now(),
    });
    
    // Check for slow renders
    if (renderTime > 100) { // 100ms
      this.emit('slow_render', {
        componentName,
        renderTime,
        timestamp: Date.now(),
      });
    }
  }

  // Cache management
  setCache(key: string, data: any, ttl: number = this.cacheConfig.maxAge): void {
    const size = this.calculateDataSize(data);
    
    // Check if adding this would exceed max cache size
    if (this.getCacheSize() + size > this.cacheConfig.maxSize * 1024 * 1024) {
      this.cleanupCache();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size,
    });
    
    this.emit('cache_set', {
      key,
      size,
      timestamp: Date.now(),
    });
  }

  getCache(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheConfig.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    this.emit('cache_hit', {
      key,
      timestamp: Date.now(),
    });
    
    return cached.data;
  }

  deleteCache(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.emit('cache_delete', {
        key,
        timestamp: Date.now(),
      });
    }
    
    return deleted;
  }

  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    
    this.emit('cache_clear', {
      clearedEntries: size,
      timestamp: Date.now(),
    });
  }

  // Calculate data size in bytes
  private calculateDataSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      return 1024; // Default 1KB
    }
  }

  // Get current cache size in bytes
  getCacheSize(): number {
    let totalSize = 0;
    for (const [, cached] of this.cache) {
      totalSize += cached.size;
    }
    return totalSize;
  }

  // Cleanup expired cache entries
  private cleanupCache(): void {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.cacheConfig.maxAge) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      this.emit('cache_cleanup', {
        deletedCount,
        timestamp: Date.now(),
      });
    }
  }

  // Start automatic cache cleanup
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache();
    }, this.cacheConfig.cleanupInterval);
  }

  // Image optimization
  optimizeImage(uri: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }): Promise<string> {
    return new Promise((resolve) => {
      // In a real app, you'd use a proper image optimization library
      // For now, we'll return the original URI
      console.log('Image optimization would happen here:', options);
      
      setTimeout(() => {
        resolve(uri);
      }, 100);
    });
  }

  // Lazy loading helper
  createLazyLoader<T>(
    loader: () => Promise<T>,
    options: {
      cacheKey?: string;
      ttl?: number;
    } = {}
  ): () => Promise<T> {
    let cached: T | null = null;
    let loading: Promise<T> | null = null;
    
    return async (): Promise<T> => {
      // Return cached data if available
      if (cached) {
        return cached;
      }
      
      // Return existing promise if loading
      if (loading) {
        return loading;
      }
      
      // Start loading
      loading = loader().then((data) => {
        cached = data;
        loading = null;
        
        // Cache the result
        if (options.cacheKey) {
          this.setCache(options.cacheKey, data, options.ttl);
        }
        
        return data;
      });
      
      return loading;
    };
  }

  // Debounce helper
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  // Throttle helper
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  // Get performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance report
  getPerformanceReport(): {
    summary: {
      appUptime: number;
      averageScreenLoadTime: number;
      averageApiResponseTime: number;
      cacheHitRate: number;
      errorRate: number;
    };
    details: PerformanceMetrics;
  } {
    const now = Date.now();
    const appUptime = now - this.metrics.appStartTime;
    
    // Calculate averages
    const screenLoadTimes = Object.values(this.metrics.screenLoadTimes);
    const averageScreenLoadTime = screenLoadTimes.length > 0
      ? screenLoadTimes.reduce((a, b) => a + b, 0) / screenLoadTimes.length
      : 0;
    
    const allApiTimes = Object.values(this.metrics.apiResponseTimes).flat();
    const averageApiResponseTime = allApiTimes.length > 0
      ? allApiTimes.reduce((a, b) => a + b, 0) / allApiTimes.length
      : 0;
    
    const cacheHitRate = 0.85; // Mock value
    const errorRate = this.metrics.errorCount / (appUptime / 1000); // errors per second
    
    return {
      summary: {
        appUptime,
        averageScreenLoadTime,
        averageApiResponseTime,
        cacheHitRate,
        errorRate,
      },
      details: { ...this.metrics },
    };
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      appStartTime: Date.now(),
      screenLoadTimes: {},
      apiResponseTimes: {},
      memoryUsage: 0,
      renderTimes: {},
      errorCount: 0,
      crashCount: 0,
    };
    
    this.emit('metrics_reset', {
      timestamp: Date.now(),
    });
  }

  // Event listeners
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
          console.error('Error in performance event callback:', error);
        }
      });
    }
  }

  // Performance recommendations
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const report = this.getPerformanceReport();
    
    if (report.summary.averageScreenLoadTime > 2000) {
      recommendations.push('Consider optimizing screen loading times');
    }
    
    if (report.summary.averageApiResponseTime > 3000) {
      recommendations.push('API response times are slow, consider caching');
    }
    
    if (report.summary.errorRate > 0.01) {
      recommendations.push('High error rate detected, review error handling');
    }
    
    if (this.metrics.memoryUsage > 80) {
      recommendations.push('High memory usage, consider memory optimization');
    }
    
    if (this.getCacheSize() > this.cacheConfig.maxSize * 1024 * 1024 * 0.8) {
      recommendations.push('Cache size is high, consider cleanup');
    }
    
    return recommendations;
  }
}

// Create and export a singleton instance
export const performanceService = PerformanceService.getInstance();

// Export types for use in components
export type { PerformanceMetrics, CacheConfig }; 