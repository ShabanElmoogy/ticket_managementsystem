import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminFeature } from '@/src/shared/hooks/useAdminFeature';
import { customersApi, customersKeys } from '../api/customers';
import { exportCustomerPdf } from '../utils/exportCustomerPdf';
import { getCustomerColumns } from '../components/customerColumns';
import type { Customer, CreateCustomerData } from '@/src/services/api/types';

export function useCustomers() {
  const { t } = useTranslation();
  const [exporting,  setExporting]  = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Rebuild columns when language changes
  const columns = useMemo(() => getCustomerColumns(t), [t]);

  const f = useAdminFeature<Customer, CreateCustomerData>({
    entityName: 'customers',
    queryKey: customersKeys.all,
    api: {
      getAll:  customersApi.getCustomers.bind(customersApi),
      create:  customersApi.createCustomer.bind(customersApi),
      update:  customersApi.updateCustomer.bind(customersApi),
      delete:  customersApi.deleteCustomer.bind(customersApi),
    },
    messages: {
      success: {
        created: t('customers.messages.created'),
        updated: t('customers.messages.updated'),
        deleted: t('customers.messages.deleted'),
      },
      error: {
        create: t('customers.messages.errorCreate'),
        update: t('customers.messages.errorUpdate'),
        delete: t('customers.messages.errorDelete'),
      },
      titles: {
        create: t('customers.addTitle'),
        edit:   t('customers.editTitle'),
      },
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try { await exportCustomerPdf(f.entities, t); }
    finally { setExporting(false); }
  };

  return { f, columns, exporting, handleExport, selectedId, setSelectedId };
}
