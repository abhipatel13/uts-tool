import { api } from '@/lib/api-client';
import { 
  ApiResponse, 
  ApprovableType, 
  EntityWithApprovals,
  PolymorphicApprovalsResponse,
  ApprovalHistoryResponse,
  isValidEntityWithApprovals
} from '@/types';

// API response validation helper
function validateEntitiesResponse(data: unknown): data is PolymorphicApprovalsResponse {
  return Boolean(
    data &&
    typeof data === 'object' &&
    data !== null &&
    'entities' in data &&
    Array.isArray((data as Record<string, unknown>).entities) &&
    'totalEntities' in data &&
    typeof (data as Record<string, unknown>).totalEntities === 'number' &&
    'totalApprovals' in data &&
    typeof (data as Record<string, unknown>).totalApprovals === 'number' &&
    'filters' in data &&
    (data as Record<string, unknown>).filters &&
    typeof (data as Record<string, unknown>).filters === 'object'
  );
}

function validateHistoryResponse(data: unknown): data is ApprovalHistoryResponse {
  return Boolean(
    data &&
    typeof data === 'object' &&
    data !== null &&
    'approvableId' in data &&
    typeof (data as Record<string, unknown>).approvableId === 'number' &&
    'approvableType' in data &&
    typeof (data as Record<string, unknown>).approvableType === 'string' &&
    'approvals' in data &&
    Array.isArray((data as Record<string, unknown>).approvals)
  );
}

export const SupervisorApprovalApi = {
  // Get all approvals (polymorphic) with proper type validation
  getApprovals: async (params?: {
    status?: 'pending' | 'approved' | 'rejected';
    includeInvalidated?: boolean;
    approvableType?: ApprovableType;
  }): Promise<ApiResponse<PolymorphicApprovalsResponse>> => {
    const searchParams = new URLSearchParams();
    
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    
    if (params?.includeInvalidated) {
      searchParams.append('includeInvalidated', 'true');
    }
    
    if (params?.approvableType) {
      searchParams.append('type', params.approvableType); // Backend uses 'type' parameter
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/api/supervisor-approvals${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<ApiResponse<unknown>>(endpoint);
    
    // Validate and transform response
    if (response.status && response.data && validateEntitiesResponse(response.data)) {
      // Filter out invalid entities and log warnings
      const validEntities = response.data.entities.filter((entity: unknown) => {
        const isValid = isValidEntityWithApprovals(entity);
        if (!isValid) {
          console.warn('Invalid entity structure received from API:', entity);
        }
        return isValid;
      }) as EntityWithApprovals[];
      
      const typedResponse: ApiResponse<PolymorphicApprovalsResponse> = {
        ...response,
        data: {
          ...response.data,
          entities: validEntities
        }
      };
      
      return typedResponse;
    }
    
    throw new Error('Invalid response format from supervisor approvals API');
  },

  // Approve or reject an entity
  approveOrReject: async (
    approvalId: string, 
    status: 'Approved' | 'Rejected', 
    comments: string = ''
  ): Promise<ApiResponse<unknown>> => {
    return api.put<ApiResponse<unknown>>(`/api/supervisor-approvals/${approvalId}`, { 
      status, 
      comments
    });
  },

  // Get approval history for an entity
  getApprovalHistory: async (
    entityId: string, 
    approvableType: ApprovableType
  ): Promise<ApiResponse<ApprovalHistoryResponse>> => {
    const response = await api.get<ApiResponse<unknown>>(
      `/api/supervisor-approvals/${entityId}/history?approvableType=${approvableType}`
    );
    
    // Validate response format
    if (response.status && response.data && validateHistoryResponse(response.data)) {
      return response as ApiResponse<ApprovalHistoryResponse>;
    }
    
    throw new Error('Invalid response format from approval history API');
  }
};
