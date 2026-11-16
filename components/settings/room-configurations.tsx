'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus, Search, Filter, Edit2, Trash2, Eye, Check, X,
  BedDouble, Users, Sparkles, Image as ImageIcon, AlertTriangle,
  Layers, CheckCircle2, SlidersHorizontal, Info, ShieldCheck
} from 'lucide-react'
import {
  RoomItem, BookingConfiguration,
  INITIAL_ROOMS, INITIAL_BOOKING_CONFIGURATIONS
} from './mock-data'

const ROOM_STATUS_COLORS: Record<string, string> = {
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Occupied: 'bg-blue-50 text-blue-700 border-blue-200',
  Cleaning: 'bg-amber-50 text-amber-700 border-amber-200',
  Maintenance: 'bg-rose-50 text-rose-700 border-rose-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200'
}

const COMMON_FACILITIES = [
  'King Bed', 'Queen Bed', 'Mountain View', 'Forest View', 'Tea Plantation View',
  'En-suite Bathroom', 'Luxury Bathtub', 'Wood Fireplace', 'Tea Station',
  'Free Wi-Fi', 'Room Heater', 'Private Verandah', 'Balcony', 'Work Desk'
]

interface RoomConfigurationsProps {
  notify: (msg: string) => void
}

export function RoomConfigurations({ notify }: RoomConfigurationsProps) {
  // Persistence with localStorage
  const [rooms, setRooms] = useState<RoomItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-rooms')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_ROOMS
  })

  const [configs, setConfigs] = useState<BookingConfiguration[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-configs')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_BOOKING_CONFIGURATIONS
  })

  useEffect(() => {
    localStorage.setItem('vtf-settings-rooms', JSON.stringify(rooms))
  }, [rooms])

  useEffect(() => {
    localStorage.setItem('vtf-settings-configs', JSON.stringify(configs))
  }, [configs])

  // Sub-tab: Rooms vs Booking Configurations
  const [activeTab, setActiveTab] = useState<'rooms' | 'configs'>('rooms')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null)
  const [viewingRoom, setViewingRoom] = useState<RoomItem | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<RoomItem | null>(null)

  // Config Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<BookingConfiguration | null>(null)

  // Form State for Room
  const [formName, setFormName] = useState('')
  const [formNumber, setFormNumber] = useState('')
  const [formType, setFormType] = useState<RoomItem['type']>('Deluxe King')
  const [formDescription, setFormDescription] = useState('')
  const [formMaxAdults, setFormMaxAdults] = useState(2)
  const [formMaxChildren, setFormMaxChildren] = useState(1)
  const [formFacilities, setFormFacilities] = useState<string[]>([])
  const [newFacilityInput, setNewFacilityInput] = useState('')
  const [formStatus, setFormStatus] = useState<RoomItem['status']>('Available')
  const [formActive, setFormActive] = useState(true)
  const [formImage, setFormImage] = useState('photo-1611892440504-42a792e24d32')

  // Form State for Booking Config
  const [configName, setConfigName] = useState('')
  const [configCode, setConfigCode] = useState('')
  const [configDesc, setConfigDesc] = useState('')
  const [configRooms, setConfigRooms] = useState<string[]>([])
  const [configMaxGuests, setConfigMaxGuests] = useState(6)
  const [configMultiplier, setConfigMultiplier] = useState(2.0)
  const [configActive, setConfigActive] = useState(true)

  // Open Add Room Modal
  const handleOpenAddRoom = () => {
    setEditingRoom(null)
    setFormName('')
    setFormNumber(`10${rooms.length + 1}`)
    setFormType('Deluxe King')
    setFormDescription('')
    setFormMaxAdults(2)
    setFormMaxChildren(1)
    setFormFacilities(['King Bed', 'Mountain View', 'En-suite Bathroom', 'Tea Station', 'Free Wi-Fi'])
    setFormStatus('Available')
    setFormActive(true)
    setFormImage('photo-1611892440504-42a792e24d32')
    setIsAddEditModalOpen(true)
  }

  // Open Edit Room Modal
  const handleOpenEditRoom = (room: RoomItem) => {
    setEditingRoom(room)
    setFormName(room.name)
    setFormNumber(room.number)
    setFormType(room.type)
    setFormDescription(room.description)
    setFormMaxAdults(room.maxAdults)
    setFormMaxChildren(room.maxChildren)
    setFormFacilities([...room.facilities])
    setFormStatus(room.status)
    setFormActive(room.active)
    setFormImage(room.image)
    setIsAddEditModalOpen(true)
  }

  // Save Room
  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formNumber.trim()) {
      notify('Please enter both Room Name and Room Number.')
      return
    }

    if (editingRoom) {
      setRooms(prev => prev.map(r => r.id === editingRoom.id ? {
        ...r,
        name: formName,
        number: formNumber,
        type: formType,
        description: formDescription,
        maxAdults: formMaxAdults,
        maxChildren: formMaxChildren,
        facilities: formFacilities,
        status: formStatus,
        active: formActive,
        image: formImage
      } : r))
      notify(`Room "${formName}" updated successfully.`)
    } else {
      const newRoom: RoomItem = {
        id: `ROOM-${Date.now().toString().slice(-4)}`,
        name: formName,
        number: formNumber,
        type: formType,
        description: formDescription,
        maxAdults: formMaxAdults,
        maxChildren: formMaxChildren,
        facilities: formFacilities,
        status: formStatus,
        active: formActive,
        image: formImage
      }
      setRooms(prev => [...prev, newRoom])
      notify(`New room "${formName}" added successfully.`)
    }
    setIsAddEditModalOpen(false)
  }

  // Toggle Room Active
  const handleToggleRoomActive = (id: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id === id) {
        const nextActive = !r.active
        notify(`Room ${r.number} is now ${nextActive ? 'Active' : 'Inactive'}.`)
        return {
          ...r,
          active: nextActive,
          status: nextActive ? (r.status === 'Inactive' ? 'Available' : r.status) : 'Inactive'
        }
      }
      return r
    }))
  }

  // Confirm Delete Room
  const handleConfirmDelete = () => {
    if (!deletingRoom) return
    setRooms(prev => prev.filter(r => r.id !== deletingRoom.id))
    notify(`Room "${deletingRoom.name}" has been removed.`)
    setDeletingRoom(null)
  }

  // Add Facility tag
  const handleAddFacility = () => {
    if (newFacilityInput.trim() && !formFacilities.includes(newFacilityInput.trim())) {
      setFormFacilities([...formFacilities, newFacilityInput.trim()])
      setNewFacilityInput('')
    }
  }

  // Remove Facility tag
  const handleRemoveFacility = (fac: string) => {
    setFormFacilities(formFacilities.filter(f => f !== fac))
  }

  // Open Add Config Modal
  const handleOpenAddConfig = () => {
    setEditingConfig(null)
    setConfigName('')
    setConfigCode(`CONFIG-0${configs.length + 1}`)
    setConfigDesc('')
    setConfigRooms(['ROOM-01', 'ROOM-02'])
    setConfigMaxGuests(5)
    setConfigMultiplier(2.0)
    setConfigActive(true)
    setIsConfigModalOpen(true)
  }

  // Open Edit Config Modal
  const handleOpenEditConfig = (cfg: BookingConfiguration) => {
    setEditingConfig(cfg)
    setConfigName(cfg.name)
    setConfigCode(cfg.code)
    setConfigDesc(cfg.description)
    setConfigRooms([...cfg.roomIds])
    setConfigMaxGuests(cfg.maxGuests)
    setConfigMultiplier(cfg.basePriceMultiplier)
    setConfigActive(cfg.active)
    setIsConfigModalOpen(true)
  }

  // Save Booking Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault()
    if (!configName.trim()) {
      notify('Please enter a configuration name.')
      return
    }
    if (configRooms.length === 0) {
      notify('Please select at least one physical bedroom for this configuration.')
      return
    }

    if (editingConfig) {
      setConfigs(prev => prev.map(c => c.id === editingConfig.id ? {
        ...c,
        name: configName,
        code: configCode,
        description: configDesc,
        roomIds: configRooms,
        maxGuests: configMaxGuests,
        basePriceMultiplier: configMultiplier,
        active: configActive
      } : c))
      notify(`Booking configuration "${configName}" updated.`)
    } else {
      const newCfg: BookingConfiguration = {
        id: `CONFIG-${Date.now().toString().slice(-4)}`,
        name: configName,
        code: configCode,
        description: configDesc,
        roomIds: configRooms,
        maxGuests: configMaxGuests,
        basePriceMultiplier: configMultiplier,
        active: configActive
      }
      setConfigs(prev => [...prev, newCfg])
      notify(`Booking configuration "${configName}" created.`)
    }
    setIsConfigModalOpen(false)
  }

  // Toggle Config Active
  const handleToggleConfigActive = (id: string) => {
    setConfigs(prev => prev.map(c => {
      if (c.id === id) {
        const next = !c.active
        notify(`Configuration "${c.name}" ${next ? 'activated' : 'deactivated'}.`)
        return { ...c, active: next }
      }
      return c
    }))
  }

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    const matchesQuery = (
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.number.includes(searchQuery) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter
    const matchesType = typeFilter === 'All' || r.type === typeFilter
    return matchesQuery && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E9EF]">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Room Configurations</h2>
          <p className="text-xs text-[#778196] mt-0.5">
            Manage physical rooms, facilities, capacities and multi-room selling configurations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-[#F2F4F8] rounded-lg">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-[#778196] hover:text-[#172B4D]'
            }`}
          >
            Physical Bedrooms ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('configs')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'configs'
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-[#778196] hover:text-[#172B4D]'
            }`}
          >
            Booking Configurations ({configs.length})
          </button>
        </div>
      </div>

      {/* ==============================================================
          TAB 1: PHYSICAL ROOMS MANAGEMENT
          ============================================================== */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* Controls: Search, Filters & Add Room Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#778196]" />
                <input
                  type="text"
                  placeholder="Search rooms by name, number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E5E9EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27877D] text-[#202939]"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EF] rounded-lg text-[#202939] focus:outline-none focus:ring-2 focus:ring-[#27877D]"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>

              {/* Room Type Filter */}
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="hidden md:block px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EF] rounded-lg text-[#202939] focus:outline-none focus:ring-2 focus:ring-[#27877D]"
              >
                <option value="All">All Types</option>
                <option value="Deluxe King">Deluxe King</option>
                <option value="Superior Queen">Superior Queen</option>
                <option value="Heritage Suite">Heritage Suite</option>
                <option value="Executive Family Suite">Executive Family Suite</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddRoom}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#27877D] hover:bg-[#1E6E66] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Room</span>
            </button>
          </div>

          {/* Rooms Table */}
          <div className="bg-white rounded-xl border border-[#E5E9EF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E9EF] text-[#778196] font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Room / Number</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Max Occupancy</th>
                    <th className="py-3 px-3">Facilities</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9EF]">
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#778196]">
                        No rooms match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map(room => (
                      <tr key={room.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#172B4D]/5 border border-[#172B4D]/10 flex items-center justify-center text-[#172B4D] font-bold text-xs shrink-0">
                              #{room.number}
                            </div>
                            <div>
                              <strong className="block text-[#172B4D] text-xs font-semibold">
                                {room.name}
                              </strong>
                              <span className="text-[11px] text-[#778196] truncate max-w-xs block">
                                {room.description}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-[#202939]">
                          {room.type}
                        </td>
                        <td className="py-3 px-3 text-[#202939]">
                          <span className="flex items-center gap-1">
                            <Users size={13} className="text-[#778196]" />
                            {room.maxAdults} Adults{room.maxChildren > 0 ? `, ${room.maxChildren} Child` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {room.facilities.slice(0, 3).map(fac => (
                              <span
                                key={fac}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-[#F0F4F8] text-[#172B4D] border border-[#E5E9EF]"
                              >
                                {fac}
                              </span>
                            ))}
                            {room.facilities.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#F2F4F7] text-[#778196]">
                                +{room.facilities.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ROOM_STATUS_COLORS[room.status]}`}>
                            {room.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRoomActive(room.id)}
                            className={`w-9 h-5 rounded-full transition-colors relative inline-flex items-center p-0.5 cursor-pointer ${
                              room.active ? 'bg-[#27877D]' : 'bg-slate-300'
                            }`}
                            aria-label="Toggle active status"
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                room.active ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingRoom(room)}
                              className="p-1.5 text-[#778196] hover:text-[#172B4D] hover:bg-[#F0F4F8] rounded transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleOpenEditRoom(room)}
                              className="p-1.5 text-[#778196] hover:text-[#27877D] hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Edit Room"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setDeletingRoom(room)}
                              className="p-1.5 text-[#778196] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Room"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 2: BOOKING CONFIGURATIONS (6 COMBINATIONS)
          ============================================================== */}
      {activeTab === 'configs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[#778196]">
              Villa Tea Fields combines its 4 physical bedrooms into 6 sellable packages (Entire Villa buyout, Wings, Suites, or standalone rooms).
            </div>
            <button
              onClick={handleOpenAddConfig}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172B4D] hover:bg-[#0F1D34] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Create Configuration</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configs.map(cfg => (
              <div
                key={cfg.id}
                className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                  cfg.active ? 'border-[#E5E9EF]' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#172B4D]/5 text-[#172B4D] font-bold">
                      {cfg.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleConfigActive(cfg.id)}
                      className={`w-8 h-4 rounded-full transition-colors relative inline-flex items-center p-0.5 cursor-pointer ${
                        cfg.active ? 'bg-[#27877D]' : 'bg-slate-300'
                      }`}
                      title={cfg.active ? 'Active' : 'Inactive'}
                    >
                      <span
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          cfg.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-[#172B4D] mb-1">
                    {cfg.name}
                  </h3>
                  <p className="text-xs text-[#778196] leading-relaxed mb-3">
                    {cfg.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E9EF] mb-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[#778196]">
                      <span>Included Bedrooms:</span>
                      <strong className="text-[#172B4D]">{cfg.roomIds.length} Bedrooms</strong>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {cfg.roomIds.map(rId => {
                        const matchedRoom = rooms.find(r => r.id === rId)
                        return (
                          <span
                            key={rId}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#27877D]/10 text-[#0F473E] border border-[#27877D]/20"
                          >
                            #{matchedRoom?.number || rId} · {matchedRoom?.name.split('·')[1]?.trim() || rId}
                          </span>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[#778196] pt-1">
                      <span>Max Total Guests:</span>
                      <strong className="text-[#172B4D]">{cfg.maxGuests} Guests</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E9EF] text-xs">
                  <span className="text-[#778196] text-[11px]">
                    Rate Mult: <b className="text-[#172B4D]">{cfg.basePriceMultiplier}x</b>
                  </span>
                  <button
                    onClick={() => handleOpenEditConfig(cfg)}
                    className="inline-flex items-center gap-1 text-[#27877D] hover:underline font-semibold cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Edit Configuration</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: ADD / EDIT ROOM
          ============================================================== */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E5E9EF] my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <h3 className="text-base font-bold text-[#172B4D]">
                {editingRoom ? `Edit ${editingRoom.name}` : 'Add New Physical Room'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={formNumber}
                    onChange={e => setFormNumber(e.target.value)}
                    placeholder="e.g. 101"
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939] focus:outline-none focus:ring-2 focus:ring-[#27877D]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Room Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939] focus:outline-none focus:ring-2 focus:ring-[#27877D]"
                  >
                    <option value="Deluxe King">Deluxe King</option>
                    <option value="Superior Queen">Superior Queen</option>
                    <option value="Heritage Suite">Heritage Suite</option>
                    <option value="Executive Family Suite">Executive Family Suite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Room Display Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Room 01 · Single Tree Deluxe"
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939] focus:outline-none focus:ring-2 focus:ring-[#27877D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Atmosphere, views, special architectural touches..."
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939] focus:outline-none focus:ring-2 focus:ring-[#27877D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Max Adults</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={formMaxAdults}
                    onChange={e => setFormMaxAdults(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Max Children</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={formMaxChildren}
                    onChange={e => setFormMaxChildren(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
              </div>

              {/* Status and Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-1.5">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={e => setFormActive(e.target.checked)}
                      className="rounded text-[#27877D] focus:ring-[#27877D]"
                    />
                    <span className="font-semibold text-[#172B4D]">Active for Reservation</span>
                  </label>
                </div>
              </div>

              {/* Facilities Editor */}
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Room Facilities & Amenities</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFacilityInput}
                    onChange={e => setNewFacilityInput(e.target.value)}
                    placeholder="Add custom facility..."
                    className="flex-1 px-3 py-1 border border-[#E5E9EF] rounded-lg text-[#202939]"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFacility() } }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFacility}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#172B4D] font-semibold rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg">
                  {formFacilities.map(f => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-white border border-[#E5E9EF] text-[#172B4D]"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFacility(f)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Image Preview & Selection */}
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Featured Room Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 rounded-lg bg-slate-100 border border-[#E5E9EF] overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={`https://images.unsplash.com/${formImage}?auto=format&fit=crop&w=150&q=80`}
                      alt="Room Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <select
                      value={formImage}
                      onChange={e => setFormImage(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                    >
                      <option value="photo-1611892440504-42a792e24d32">Single Tree Deluxe (Valley Balcony)</option>
                      <option value="photo-1616594039964-ae9021a400a0">Planter&apos;s Vista (Fireplace Verandah)</option>
                      <option value="photo-1618221195710-dd6b41faaea6">Highland Heritage (Pine Forest View)</option>
                      <option value="photo-1616486338812-3dadae4b4ace">Pedro Valley Suite (Duplex Jacuzzi)</option>
                    </select>
                    <span className="text-[10px] text-[#778196]">Frontend preview of uploaded estate imagery</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#27877D] hover:bg-[#1E6E66] text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: VIEW ROOM DETAILS
          ============================================================== */}
      {viewingRoom && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <div>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#172B4D]/5 text-[#172B4D] font-bold">
                  Room #{viewingRoom.number}
                </span>
                <h3 className="text-base font-bold text-[#172B4D] mt-1">
                  {viewingRoom.name}
                </h3>
              </div>
              <button
                onClick={() => setViewingRoom(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 border border-[#E5E9EF]">
                <img
                  src={`https://images.unsplash.com/${viewingRoom.image}?auto=format&fit=crop&w=600&q=80`}
                  alt={viewingRoom.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-[#64748B] leading-relaxed">
                {viewingRoom.description}
              </p>

              <div className="grid grid-cols-2 gap-2 p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E9EF]">
                <div>
                  <span className="text-[#778196] block text-[11px]">Type:</span>
                  <strong className="text-[#172B4D]">{viewingRoom.type}</strong>
                </div>
                <div>
                  <span className="text-[#778196] block text-[11px]">Occupancy:</span>
                  <strong className="text-[#172B4D]">{viewingRoom.maxAdults} Adults, {viewingRoom.maxChildren} Child</strong>
                </div>
                <div>
                  <span className="text-[#778196] block text-[11px]">Current Status:</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ROOM_STATUS_COLORS[viewingRoom.status]}`}>
                    {viewingRoom.status}
                  </span>
                </div>
                <div>
                  <span className="text-[#778196] block text-[11px]">Reservation Active:</span>
                  <strong className={viewingRoom.active ? 'text-emerald-600' : 'text-slate-500'}>
                    {viewingRoom.active ? 'Yes (Bookable)' : 'No (Inactive)'}
                  </strong>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#172B4D] block mb-1.5">Facilities:</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewingRoom.facilities.map(fac => (
                    <span
                      key={fac}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] border border-slate-200"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E5E9EF] flex justify-end">
              <button
                onClick={() => setViewingRoom(null)}
                className="px-4 py-1.5 bg-[#172B4D] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: DELETE ROOM CONFIRMATION
          ============================================================== */}
      {deletingRoom && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-[#172B4D]">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Are you sure you want to remove <strong>{deletingRoom.name}</strong> from the property inventory? This action is mock-only and can be reset.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingRoom(null)}
                className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: CREATE / EDIT BOOKING CONFIGURATION
          ============================================================== */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <h3 className="text-base font-bold text-[#172B4D]">
                {editingConfig ? 'Edit Booking Configuration' : 'Create Booking Configuration'}
              </h3>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Package / Config Name *</label>
                <input
                  type="text"
                  required
                  value={configName}
                  onChange={e => setConfigName(e.target.value)}
                  placeholder="e.g. Upper Highland Vista Wing"
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Code / Identifier</label>
                  <input
                    type="text"
                    value={configCode}
                    onChange={e => setConfigCode(e.target.value)}
                    placeholder="e.g. WING-UPPER"
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Max Total Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={configMaxGuests}
                    onChange={e => setConfigMaxGuests(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={configDesc}
                  onChange={e => setConfigDesc(e.target.value)}
                  placeholder="Explain what this configuration entails for guests..."
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              {/* Select Included Bedrooms */}
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Select Included Physical Bedrooms ({configRooms.length} selected)
                </label>
                <div className="space-y-1.5 p-2.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg">
                  {rooms.map(room => {
                    const isChecked = configRooms.includes(room.id)
                    return (
                      <label
                        key={room.id}
                        className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setConfigRooms(configRooms.filter(id => id !== room.id))
                              } else {
                                setConfigRooms([...configRooms, room.id])
                              }
                            }}
                            className="rounded text-[#27877D] focus:ring-[#27877D]"
                          />
                          <span>#{room.number} · {room.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {room.type}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Price Multiplier</label>
                  <input
                    type="number"
                    step="0.05"
                    min={0.5}
                    max={5.0}
                    value={configMultiplier}
                    onChange={e => setConfigMultiplier(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                  <span className="text-[10px] text-[#778196]">Relative to standard room rate</span>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={configActive}
                      onChange={e => setConfigActive(e.target.checked)}
                      className="rounded text-[#27877D] focus:ring-[#27877D]"
                    />
                    <span className="font-semibold text-[#172B4D]">Active for OTA & Direct</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#172B4D] hover:bg-[#0F1D34] text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {editingConfig ? 'Update Configuration' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
