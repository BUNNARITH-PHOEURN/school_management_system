import { useState } from 'react'
import { classes, teachers, subjects, getTeacherName, getSubjectName, type Class } from '../data/mockData'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle } from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { EmptyState } from '../components/Skeleton'

export default function TeacherAssignments() {
  const { toast } = useToast()
  const [classData, setClassData] = useState(classes)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [assignModal, setAssignModal] = useState(false)
  const [newTeacherId, setNewTeacherId] = useState(teachers[0].id)
  const [search, setSearch] = useState('')

  const activeClasses = classData.filter(c =>
    c.status === 'active' &&
    `${c.name} ${getSubjectName(c.subjectId)}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleAssign = () => {
    if (!selectedClass) return
    if (selectedClass.teacherIds.includes(newTeacherId)) {
      toast('error', 'This teacher is already assigned to the class.')
      return
    }
    setClassData(prev => prev.map(c =>
      c.id === selectedClass.id ? { ...c, teacherIds: [...c.teacherIds, newTeacherId] } : c
    ))
    setSelectedClass(prev => prev ? { ...prev, teacherIds: [...prev.teacherIds, newTeacherId] } : prev)
    toast('success', `${getTeacherName(newTeacherId)} assigned successfully.`)
    setAssignModal(false)
  }

  const handleRemove = (classId: number, teacherId: number) => {
    setClassData(prev => prev.map(c =>
      c.id === classId ? { ...c, teacherIds: c.teacherIds.filter(id => id !== teacherId) } : c
    ))
    if (selectedClass?.id === classId) {
      setSelectedClass(prev => prev ? { ...prev, teacherIds: prev.teacherIds.filter(id => id !== teacherId) } : prev)
    }
    toast('info', 'Teacher removed from class.')
  }

  const currentClass = selectedClass ? classData.find(c => c.id === selectedClass.id) ?? selectedClass : null

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Teacher Assignments</h1>
        <p className="text-sm" style={{ color: '#9ca3af' }}>Assign and manage teachers per class</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Class list */}
        <div className="lg:col-span-2 bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
          <div className="p-4 border-b" style={{ borderColor: '#f0f3fa' }}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find class…" className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#e2e7f0', color: '#1a1f36' }} />
            </div>
          </div>

          {activeClasses.length === 0 ? (
            <EmptyState icon="📚" title="No classes found" />
          ) : (
            <div className="divide-y" style={{ borderColor: '#f5f6fa' }}>
              {activeClasses.map(cls => {
                const isSelected = currentClass?.id === cls.id
                const teacherCount = cls.teacherIds.length
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className="w-full text-left px-4 py-3.5 transition-colors"
                    style={{ backgroundColor: isSelected ? '#eff2ff' : 'transparent', borderLeft: `3px solid ${isSelected ? '#3b5bdb' : 'transparent'}` }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f8f9fd' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif', color: isSelected ? '#3b5bdb' : '#1a1f36' }}>{cls.name}</div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: '#9ca3af' }}>{getSubjectName(cls.subjectId)} · {cls.room}</div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: teacherCount > 0 ? '#d1fae5' : '#f3f4f6', color: teacherCount > 0 ? '#065f46' : '#9ca3af', fontFamily: 'Outfit, sans-serif' }}>
                          {teacherCount} {teacherCount === 1 ? 'teacher' : 'teachers'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {cls.teacherIds.slice(0, 2).map(tid => (
                        <span key={tid} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb' }}>{getTeacherName(tid).split(' ').pop()}</span>
                      ))}
                      {cls.teacherIds.length > 2 && <span className="text-xs" style={{ color: '#9ca3af' }}>+{cls.teacherIds.length - 2} more</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {!currentClass ? (
            <div className="bg-white rounded-xl border h-full flex items-center justify-center" style={{ borderColor: '#e2e7f0', minHeight: 300 }}>
              <EmptyState icon="👈" title="Select a class" description="Click a class on the left to view and manage its teachers." />
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: '#f0f3fa', backgroundColor: '#f8f9fd' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{currentClass.name}</h2>
                    <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: '#9ca3af' }}>
                      <span>{getSubjectName(currentClass.subjectId)}</span>
                      <span>·</span>
                      <span>{currentClass.room}</span>
                      <span>·</span>
                      <span>{currentClass.day}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setNewTeacherId(teachers.find(t => t.status === 'active' && !currentClass.teacherIds.includes(t.id))?.id ?? teachers[0].id); setAssignModal(true) }}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg text-white flex items-center gap-1.5"
                    style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Assign Teacher
                  </button>
                </div>
              </div>

              {currentClass.teacherIds.length === 0 ? (
                <EmptyState icon="👤" title="No teachers assigned" description="Use the button above to assign a teacher to this class." />
              ) : (
                <div className="divide-y" style={{ borderColor: '#f5f6fa' }}>
                  {currentClass.teacherIds.map(tid => {
                    const teacher = teachers.find(t => t.id === tid)
                    if (!teacher) return null
                    return (
                      <div key={tid} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#d1fae5', color: '#065f46', fontFamily: 'Outfit, sans-serif' }}>
                          {teacher.firstName.replace('Dr. ', '')[0]}{teacher.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{teacher.firstName} {teacher.lastName}</div>
                          <div className="text-xs" style={{ color: '#9ca3af' }}>{teacher.code} · {teacher.specialization}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant(teacher.status)} dot>{teacher.status}</Badge>
                          <button
                            onClick={() => handleRemove(currentClass.id, tid)}
                            className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
                            title="Remove teacher"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6 M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Subject assignments section */}
              <div className="px-5 py-4 border-t" style={{ borderColor: '#f0f3fa', backgroundColor: '#f8f9fd' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>Subject Info</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>Subject</div>
                    <div className="font-medium mt-0.5" style={{ color: '#1a1f36' }}>{getSubjectName(currentClass.subjectId)}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>Schedule</div>
                    <div className="font-medium mt-0.5" style={{ color: '#1a1f36' }}>{currentClass.startTime} – {currentClass.endTime}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>Day(s)</div>
                    <div className="font-medium mt-0.5" style={{ color: '#1a1f36' }}>{currentClass.day}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign modal */}
      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title="Assign Teacher to Class"
        width={420}
        footer={
          <>
            <button onClick={() => setAssignModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleAssign} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>Assign</button>
          </>
        }
      >
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#f8f9fd', color: '#374151' }}>
          Assigning to: <strong style={{ color: '#1a1f36' }}>{currentClass?.name}</strong>
        </div>
        <FormField label="Select Teacher" required>
          <select value={newTeacherId} onChange={e => setNewTeacherId(Number(e.target.value))} className={inputClass} style={inputStyle}>
            {teachers.filter(t => t.status === 'active').map(t => (
              <option key={t.id} value={t.id} disabled={currentClass?.teacherIds.includes(t.id)}>
                {t.firstName} {t.lastName} — {t.specialization}{currentClass?.teacherIds.includes(t.id) ? ' (already assigned)' : ''}
              </option>
            ))}
          </select>
        </FormField>
      </Modal>
    </div>
  )
}
