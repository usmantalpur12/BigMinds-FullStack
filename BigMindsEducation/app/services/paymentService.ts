import { backendAPI } from './backendAPI';

export const paymentService = {
  async getPaymentHistory() {
    const res = await backendAPI.get('/payments/history');
    return res.data.data as any[];
  }
}; 