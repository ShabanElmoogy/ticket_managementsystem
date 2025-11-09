import { type CreateApplicationData, type Application } from "../../../../services/api";
import { useEntityData } from "./base/useEntityData";
import { applicationsApi } from "../api/applications";
import { applicationsKeys } from "../services/keys";

export interface ApplicationsDataReturn {
  applications: Application[];
  loading: boolean;
  create: (data: CreateApplicationData) => Promise<Application>;
  update: (id: string | number, data: CreateApplicationData) => Promise<Application>;
  remove: (id: string | number) => Promise<void>;
  refetch: () => void;
}

export function useApplicationsData(): ApplicationsDataReturn {
  const { entities, loading, create, update, remove, refetch } = useEntityData({
    queryKey: applicationsKeys.all,
    api: {
      getAll: applicationsApi.getApplications.bind(applicationsApi),
      create: applicationsApi.createApplication.bind(applicationsApi),
      update: applicationsApi.updateApplication.bind(applicationsApi),
      delete: applicationsApi.deleteApplication.bind(applicationsApi),
    },
  });

  return { 
    applications: entities, 
    loading, 
    create, 
    update, 
    remove, 
    refetch 
  };
}

export default useApplicationsData;
