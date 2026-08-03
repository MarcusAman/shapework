import React, { useState, useEffect } from 'react';
import { X, Search, Shield, User, Users, Activity, Phone, Mail, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StaffMemberProfile } from '../../../server/persistence/operationsDirectoryRepository';

interface OperationsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperationsDirectoryModal: React.FC<OperationsDirectoryModalProps> = ({ isOpen, onClose }) => {
  const [staff, setStaff] = useState<StaffMemberProfile[]>([]);
  const [capacity, setCapacity] = useState<{ totalActive: number; totalCapacity: number; utilizationPercent: number }>({
    totalActive: 0,
    totalCapacity: 0,
    utilizationPercent: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/directory/staff')
        .then(res => res.json())
        .then(data => {
          if (data.success) setStaff(data.staff);
        })
        .catch(err => console.error('Failed to fetch staff directory:', err));

      fetch('/api/directory/capacity')
        .then(res => res.json())
        .then(data => {
          if (data.success) setCapacity(data.metrics);
        })
        .catch(err => console.error('Failed to fetch capacity metrics:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const selectedStaff = staff.find(s => s.id === selectedStaffId) || staff[0];
  const escalationContact = staff.find(s => s.id === selectedStaff?.escalationContactId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#fffdf8] w-full max-w-5xl h-[85vh] rounded-2xl border border-[#d0d6bb]/40 shadow-2xl flex flex-col overflow-hidden font-sans text-[#13231e]">
        
        {/* HEADER */}
        <div className="bg-[#01362d] px-6 py-4 flex items-center justify-between border-b border-[rgba(208,214,187,0.2)] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl">Operations Directory & Roster</h2>
              <p className="text-xs text-[#d0d6bb]">Brokerage staff profiles, role permissions, and active workload capacity</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-[#d0d6bb] hover:text-white transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TEAM CAPACITY METRICS BAR */}
        <div className="bg-[#f6f7f1] px-6 py-3 border-b border-[#d0d6bb]/30 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500">Total Active Tasks: </span>
              <span className="font-bold text-[#13231e]">{capacity.totalActive}</span>
            </div>
            <div>
              <span className="text-slate-500">Total Team Capacity: </span>
              <span className="font-bold text-[#13231e]">{capacity.totalCapacity}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Workload Utilization: </span>
              <span className={`font-bold px-2 py-0.5 rounded-full ${capacity.utilizationPercent > 80 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {capacity.utilizationPercent}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#00635c]">
            <Activity className="w-4 h-4" />
            <span>Real-time Operations Load Active</span>
          </div>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: ROSTER LIST */}
          <div className="w-1/2 border-r border-[#d0d6bb]/30 flex flex-col p-4 space-y-4 overflow-y-auto">
            
            {/* CONTROLS */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#00635c]"
                />
              </div>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#00635c]"
              >
                <option value="all">All Roles</option>
                <option value="marketing_specialist">Marketing</option>
                <option value="closing_coordinator">Closing</option>
                <option value="broker_of_record">Broker</option>
                <option value="va_assistant">VA Assistant</option>
              </select>
            </div>

            {/* STAFF LIST */}
            <div className="space-y-2">
              {filteredStaff.map(member => {
                const isSelected = selectedStaff?.id === member.id;
                const capacityRatio = member.activeWorkloadCount / member.maxWorkloadCapacity;
                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedStaffId(member.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected ? 'bg-[#01362d]/5 border-[#00635c]' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden border border-slate-300">
                        {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" /> : member.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#13231e]">{member.fullName}</h4>
                        <p className="text-xs text-slate-500">{member.title}</p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-xs font-semibold text-slate-600">
                        {member.activeWorkloadCount} / {member.maxWorkloadCapacity} Tasks
                      </div>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${capacityRatio > 0.8 ? 'bg-amber-500' : 'bg-[#00635c]'}`}
                          style={{ width: `${Math.min(100, capacityRatio * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: SELECTED MEMBER PROFILE & ESCALATION */}
          <div className="w-1/2 p-6 flex flex-col justify-between overflow-y-auto bg-white">
            {selectedStaff ? (
              <div className="space-y-6">
                
                {/* PROFILE HEADER */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xl text-slate-700 overflow-hidden border-2 border-[#00635c]">
                    {selectedStaff.avatarUrl ? <img src={selectedStaff.avatarUrl} alt="" className="w-full h-full object-cover" /> : selectedStaff.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl text-[#13231e]">{selectedStaff.fullName}</h3>
                    <p className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {selectedStaff.title}
                    </p>
                  </div>
                </div>

                {/* CONTACT DETAILS */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-[#00635c]" />
                    <span>{selectedStaff.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-[#00635c]" />
                    <span>{selectedStaff.phone}</span>
                  </div>
                </div>

                {/* SKILLS */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specialized Capabilities</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStaff.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ESCALATION PATHWAY */}
                <div className="p-4 bg-[#f6f7f1] rounded-xl border border-[#d0d6bb]/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#13231e]">
                    <Shield className="w-4 h-4 text-[#00635c]" />
                    <span>Escalation Pathway</span>
                  </div>
                  {escalationContact ? (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-600">Primary Escalation Contact:</span>
                      <span className="font-bold text-[#00635c]">{escalationContact.fullName} ({escalationContact.title})</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Highest authority (Broker of Record)</p>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Select a staff member to view profile
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#00635c] hover:bg-[#004d48] text-white font-bold text-xs rounded-lg transition-all"
              >
                Close Directory
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
