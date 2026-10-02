import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentService } from '../services/paymentService';
import { userService } from '../services/userService';
import {
  TeacherButton,
  TeacherSkeleton,
  TeacherErrorBoundary,
  TeacherTextInput,
  TeacherSelect,
  TeacherSheet,
  showTeacherToast,
} from './components';
import { useTeacherTheme } from '../theme/teacherTheme';
import EmptyAnimation from '../../assets/teacher-empty.json';

const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(3, 'Account holder name required'),
  accountNumber: z.string().min(10, 'Valid account number required'),
  bankName: z.string().min(2, 'Bank name required'),
  branchName: z.string().min(2, 'Branch name required'),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
});

const payoutSchema = z.object({
  minimumPayoutAmount: z.string().regex(/^\d+$/, 'Enter valid amount').transform(Number),
  payoutFrequency: z.enum(['weekly', 'monthly', 'quarterly']),
  preferredMethod: z.enum(['bank_transfer', 'easypaisa', 'jazzcash']),
});

const taxSchema = z.object({
  taxId: z.string().min(5, 'Tax ID required'),
  taxCategory: z.enum(['individual', 'business']),
  taxRate: z.string().regex(/^\d+(\.\d+)?$/, 'Enter valid rate').transform(Number).optional(),
});

type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;
type PayoutFormValues = z.infer<typeof payoutSchema>;
type TaxFormValues = z.infer<typeof taxSchema>;

export default function EarningsScreen() {
  const {
    theme: { spacing, text, typography, surface, radius, background, semantic },
  } = useTeacherTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [showPayoutSheet, setShowPayoutSheet] = useState(false);
  const [showTaxSheet, setShowTaxSheet] = useState(false);
  const [financialInfo, setFinancialInfo] = useState<any>(null);

  const bankForm = useForm<BankDetailsFormValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      iban: '',
      swiftCode: '',
    },
  });

  const payoutForm = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      minimumPayoutAmount: 1000,
      payoutFrequency: 'monthly',
      preferredMethod: 'bank_transfer',
    },
  });

  const taxForm = useForm<TaxFormValues>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      taxId: '',
      taxCategory: 'individual',
      taxRate: undefined,
    },
  });

  const loadFinancialInfo = useCallback(async () => {
    try {
      const profile = await userService.getMe();
      const bankInfo = profile?.teacherProfile?.bankDetails || {};
      const payoutInfo = profile?.teacherProfile?.payoutSettings || {};
      const taxInfo = profile?.teacherProfile?.taxInfo || {};
      
      setFinancialInfo({ bankInfo, payoutInfo, taxInfo });
      
      bankForm.reset({
        accountHolderName: bankInfo.accountHolderName || '',
        accountNumber: bankInfo.accountNumber || '',
        bankName: bankInfo.bankName || '',
        branchName: bankInfo.branchName || '',
        iban: bankInfo.iban || '',
        swiftCode: bankInfo.swiftCode || '',
      });
      
      payoutForm.reset({
        minimumPayoutAmount: payoutInfo.minimumPayoutAmount || 1000,
        payoutFrequency: payoutInfo.payoutFrequency || 'monthly',
        preferredMethod: payoutInfo.preferredMethod || 'bank_transfer',
      });
      
      taxForm.reset({
        taxId: taxInfo.taxId || '',
        taxCategory: taxInfo.taxCategory || 'individual',
        taxRate: taxInfo.taxRate || undefined,
      });
    } catch (e) {
      console.error('Failed to load financial info:', e);
    }
  }, [bankForm, payoutForm, taxForm]);

  const load = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await paymentService.getPaymentHistory();
      setPayments(Array.isArray(data) ? data : []);
      await loadFinancialInfo();
    } catch (e) {
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, loadFinancialInfo]);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(() => payments.reduce((sum, p) => sum + (p.amount || 0), 0), [payments]);

  const chartPath = useMemo(() => {
    if (!payments.length) return '';
    const points = payments.slice(0, 10).map((p) => p.amount || 0);
    const max = Math.max(...points, 1);
    const stepX = 140 / (points.length - 1 || 1);
    return points
      .map((value, idx) => {
        const x = idx * stepX;
        const y = 60 - (value / max) * 60;
        return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }, [payments]);

  const saveBankDetails = async (values: BankDetailsFormValues) => {
    try {
      await userService.updateMe({
        teacherProfile: {
          bankDetails: values,
        },
      } as any);
      showTeacherToast({ type: 'success', title: 'Bank details saved' });
      setShowBankSheet(false);
      loadFinancialInfo();
    } catch (error: any) {
      showTeacherToast({
        type: 'error',
        title: 'Save failed',
        message: error?.response?.data?.message || 'Please try again.',
      });
    }
  };

  const savePayoutSettings = async (values: PayoutFormValues) => {
    try {
      await userService.updateMe({
        teacherProfile: {
          payoutSettings: values,
        },
      } as any);
      showTeacherToast({ type: 'success', title: 'Payout settings saved' });
      setShowPayoutSheet(false);
      loadFinancialInfo();
    } catch (error: any) {
      showTeacherToast({
        type: 'error',
        title: 'Save failed',
        message: error?.response?.data?.message || 'Please try again.',
      });
    }
  };

  const saveTaxInfo = async (values: TaxFormValues) => {
    try {
      await userService.updateMe({
        teacherProfile: {
          taxInfo: values,
        },
      } as any);
      showTeacherToast({ type: 'success', title: 'Tax information saved' });
      setShowTaxSheet(false);
      loadFinancialInfo();
    } catch (error: any) {
      showTeacherToast({
        type: 'error',
        title: 'Save failed',
        message: error?.response?.data?.message || 'Please try again.',
      });
    }
  };

  return (
    <TeacherErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: background.default }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text
          style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: typography.sizes['2xl'],
            color: text.primary,
            marginBottom: spacing.md,
          }}
        >
          Earnings
        </Text>

        {loading ? (
          <View style={{ gap: spacing.md }}>
            <TeacherSkeleton height={120} />
            {Array.from({ length: 3 }).map((_, idx) => (
              <TeacherSkeleton key={idx} height={80} />
            ))}
          </View>
        ) : (
          <>
            <View
              style={{
                backgroundColor: surface.default,
                borderRadius: radius.xl,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: surface.border,
                marginBottom: spacing.lg,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamily.medium,
                  color: text.secondary,
                  marginBottom: spacing.xs,
                }}
              >
                Total Revenue
              </Text>
              <Text
                style={{
                  fontFamily: typography.fontFamily.bold,
                  fontSize: typography.sizes['3xl'],
                  color: semantic.success.default,
                }}
              >
                Rs. {total.toLocaleString()}
              </Text>
              {payments.length > 0 && chartPath ? (
                <Svg width={150} height={70} viewBox="0 0 150 70" style={{ marginTop: spacing.sm }}>
                  <Path d={chartPath} stroke={semantic.primary.default} strokeWidth={3} fill="none" />
                </Svg>
              ) : null}
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
                <TeacherButton
                  title="Bank Details"
                  fullWidth={false}
                  variant="outline"
                  icon="card"
                  onPress={() => setShowBankSheet(true)}
                  style={{ flex: 1, minWidth: '48%' }}
                />
                <TeacherButton
                  title="Payout Settings"
                  fullWidth={false}
                  variant="outline"
                  icon="cash"
                  onPress={() => setShowPayoutSheet(true)}
                  style={{ flex: 1, minWidth: '48%' }}
                />
                <TeacherButton
                  title="Tax Info"
                  fullWidth={false}
                  variant="outline"
                  icon="document-text"
                  onPress={() => setShowTaxSheet(true)}
                  style={{ flex: 1, minWidth: '48%' }}
                />
                <TeacherButton
                  title="Request Payout"
                  fullWidth={false}
                  variant="secondary"
                  icon="send"
                  onPress={() =>
                    showTeacherToast({
                      type: 'info',
                      title: 'Coming soon',
                      message: 'Payout automation is on the roadmap.',
                    })
                  }
                  style={{ flex: 1, minWidth: '48%' }}
                />
              </View>
            </View>

            <Text
              style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.sizes.lg,
                color: text.primary,
                marginBottom: spacing.sm,
              }}
            >
              Recent Payments
            </Text>

            {payments.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
                <LottieView source={EmptyAnimation} autoPlay loop style={{ width: 200, height: 200 }} />
                <Text style={{ color: text.secondary, marginTop: spacing.sm }}>No payments yet.</Text>
              </View>
            ) : (
              payments.map((payment, idx) => (
                <View
                  key={payment._id || idx}
                  style={{
                    backgroundColor: surface.default,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: surface.border,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.semibold,
                      color: text.primary,
                    }}
                  >
                    {payment.description || 'Course payment'}
                  </Text>
                  <Text
                    style={{
                      color: text.secondary,
                      marginTop: spacing.micro,
                    }}
                  >
                    Amount: Rs. {(payment.amount || 0).toLocaleString()}
                  </Text>
                  <Text style={{ color: text.secondary }}>
                    Date: {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Bank Details Sheet */}
      <TeacherSheet
        visible={showBankSheet}
        onClose={() => setShowBankSheet(false)}
        title="Bank Details"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Controller
            control={bankForm.control}
            name="accountHolderName"
            render={({ field, fieldState }) => (
              <TeacherTextInput
                label="Account Holder Name"
                value={field.value}
                onChangeText={field.onChange}
                errorText={fieldState.error?.message}
                isRequired
                leftIcon="person"
              />
            )}
          />
          <Controller
            control={bankForm.control}
            name="accountNumber"
            render={({ field, fieldState }) => (
              <TeacherTextInput
                label="Account Number"
                value={field.value}
                onChangeText={field.onChange}
                errorText={fieldState.error?.message}
                isRequired
                keyboardType="numeric"
                leftIcon="card"
              />
            )}
          />
          <Controller
            control={bankForm.control}
            name="bankName"
            render={({ field, fieldState }) => (
              <TeacherTextInput
                label="Bank Name"
                value={field.value}
                onChangeText={field.onChange}
                errorText={fieldState.error?.message}
                isRequired
                leftIcon="business"
              />
            )}
          />
          <Controller
            control={bankForm.control}
            name="branchName"
            render={({ field, fieldState }) => (
              <TeacherTextInput
                label="Branch Name"
                value={field.value}
                onChangeText={field.onChange}
                errorText={fieldState.error?.message}
                isRequired
                leftIcon="location"
              />
            )}
          />
          <Controller
            control={bankForm.control}
            name="iban"
            render={({ field }) => (
              <TeacherTextInput
                label="IBAN (Optional)"
                value={field.value}
                onChangeText={field.onChange}
                placeholder="PK00XXXX0000000000000000"
                leftIcon="code"
              />
            )}
          />
          <Controller
            control={bankForm.control}
            name="swiftCode"
            render={({ field }) => (
              <TeacherTextInput
                label="SWIFT Code (Optional)"
                value={field.value}
                onChangeText={field.onChange}
                placeholder="ABCDPKKA"
                leftIcon="key"
              />
            )}
          />
          <TeacherButton
            title={bankForm.formState.isSubmitting ? 'Saving...' : 'Save Bank Details'}
            onPress={bankForm.handleSubmit(saveBankDetails)}
            loading={bankForm.formState.isSubmitting}
            icon="save"
            style={{ marginTop: spacing.md }}
          />
        </KeyboardAvoidingView>
      </TeacherSheet>

      {/* Payout Settings Sheet */}
      <TeacherSheet
        visible={showPayoutSheet}
        onClose={() => setShowPayoutSheet(false)}
        title="Payout Settings"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Controller
            control={payoutForm.control}
            name="minimumPayoutAmount"
            render={({ field, fieldState }) => (
              <TeacherTextInput
                label="Minimum Payout Amount (PKR)"
                value={field.value?.toString() || ''}
                onChangeText={(text) => field.onChange(text)}
                errorText={fieldState.error?.message}
                isRequired
                keyboardType="numeric"
                leftIcon="cash"
              />
            )}
          />
          <Controller
            control={payoutForm.control}
            name="payoutFrequency"
            render={({ field, fieldState }) => (
              <TeacherSelect
                label="Payout Frequency"
                value={field.value}
                onChange={field.onChange}
                errorText={fieldState.error?.message}
                options={[
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Quarterly', value: 'quarterly' },
                ]}
              />
            )}
          />
          <Controller
            control={payoutForm.control}
            name="preferredMethod"
            render={({ field, fieldState }) => (
              <TeacherSelect
                label="Preferred Payout Method"
                value={field.value}
                onChange={field.onChange}
                errorText={fieldState.error?.message}
                options={[
                  { label: 'Bank Transfer', value: 'bank_transfer' },
                  { label: 'EasyPaisa', value: 'easypaisa' },
                  { label: 'JazzCash', value: 'jazzcash' },
                ]}
              />
            )}
          />
          <TeacherButton
            title={payoutForm.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
            onPress={payoutForm.handleSubmit(savePayoutSettings)}
            loading={payoutForm.formState.isSubmitting}
            icon="save"
            style={{ marginTop: spacing.md }}
          />
        </KeyboardAvoidingView>
      </TeacherSheet>

      {/* Tax Information Sheet */}
      <TeacherSheet
        visible={showTaxSheet}
        onClose={() => setShowTaxSheet(false)}
        title="Tax Information"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Controller
            control={taxForm.control}
            name="taxId"
            render={({ field, fieldState }) => (
              <TeacherTextInput
                label="Tax ID / NTN"
                value={field.value}
                onChangeText={field.onChange}
                errorText={fieldState.error?.message}
                isRequired
                leftIcon="document"
              />
            )}
          />
          <Controller
            control={taxForm.control}
            name="taxCategory"
            render={({ field, fieldState }) => (
              <TeacherSelect
                label="Tax Category"
                value={field.value}
                onChange={field.onChange}
                errorText={fieldState.error?.message}
                options={[
                  { label: 'Individual', value: 'individual' },
                  { label: 'Business', value: 'business' },
                ]}
              />
            )}
          />
          <Controller
            control={taxForm.control}
            name="taxRate"
            render={({ field, fieldState }) => (
              <TeacherTextInput
                label="Tax Rate (%) (Optional)"
                value={field.value?.toString() || ''}
                onChangeText={(text) => field.onChange(text ? parseFloat(text) : undefined)}
                errorText={fieldState.error?.message}
                keyboardType="decimal-pad"
                leftIcon="calculator"
                placeholder="e.g., 5.5"
              />
            )}
          />
          <TeacherButton
            title={taxForm.formState.isSubmitting ? 'Saving...' : 'Save Tax Info'}
            onPress={taxForm.handleSubmit(saveTaxInfo)}
            loading={taxForm.formState.isSubmitting}
            icon="save"
            style={{ marginTop: spacing.md }}
          />
        </KeyboardAvoidingView>
      </TeacherSheet>
    </TeacherErrorBoundary>
  );
}