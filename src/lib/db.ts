import { supabase } from './supabaseClient';
import { TABLES, BUCKETS } from '@/config/db';
import type { Event, EventMaterial, DevoteeSubmission, AdminProfile, EventUpsert } from '@/types';

export const db = {
  events: {
    getActive: async () => {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
    getCarousel: async () => {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('show_in_carousel', true)
        .eq('status', 'Active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
    getById: async (eventId: string) => {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*, event_materials(*)')
        .eq('event_id', eventId)
        .single();
      if (error) throw error;
      return data as Event & { event_materials: EventMaterial[] };
    },
    getAll: async () => {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
    create: async (event: EventUpsert) => {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .insert(event)
        .select()
        .single();
      if (error) throw error;
      return data as Event;
    },
    update: async (eventId: string, patch: Partial<EventUpsert>) => {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .update(patch)
        .eq('event_id', eventId)
        .select()
        .single();
      if (error) throw error;
      return data as Event;
    },
    remove: async (eventId: string) => {
      const { error } = await supabase
        .from(TABLES.EVENTS)
        .delete()
        .eq('event_id', eventId);
      if (error) throw error;
    },
  },

  materials: {
    getByEvent: async (eventId: string) => {
      const { data, error } = await supabase
        .from(TABLES.EVENT_MATERIALS)
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as EventMaterial[];
    },
  },

  submissions: {
    create: async (submission: Omit<DevoteeSubmission, 'receipt_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from(TABLES.DEVOTEE_SUBMISSIONS)
        .insert(submission)
        .select()
        .single();
      if (error) throw error;
      return data as DevoteeSubmission;
    },
    getAll: async () => {
      const { data, error } = await supabase
        .from(TABLES.DEVOTEE_SUBMISSIONS)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DevoteeSubmission[];
    },
    updateApproval: async (receiptId: string, status: 'Pending' | 'Approved' | 'Rejected') => {
      const { data, error } = await supabase
        .from(TABLES.DEVOTEE_SUBMISSIONS)
        .update({ admin_approval: status })
        .eq('receipt_id', receiptId)
        .select()
        .single();
      if (error) throw error;
      return data as DevoteeSubmission;
    },
  },

  admin: {
    getProfile: async (userId: string) => {
      const { data, error } = await supabase
        .from(TABLES.ADMIN_PROFILES)
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data as AdminProfile;
    },
    getAllProfiles: async () => {
      const { data, error } = await supabase
        .from(TABLES.ADMIN_PROFILES)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as AdminProfile[];
    },
    updateApproval: async (userId: string, isApproved: boolean) => {
      const { data, error } = await supabase
        .from(TABLES.ADMIN_PROFILES)
        .update({ is_approved: isApproved })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as AdminProfile;
    },
  },

  storage: {
    uploadPaymentProof: async (file: File): Promise<string> => {
      const fileName = `receipts/${Date.now()}_${file.name}`;
      const { error, data } = await supabase.storage
        .from(BUCKETS.PAYMENT_PROOFS)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(BUCKETS.PAYMENT_PROOFS)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    },
  },
};
