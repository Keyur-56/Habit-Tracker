import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, TrendingUp, CheckCircle2, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

const HabitTrackerApp = () => {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💪');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(false);

  const API_URL = 'http://localhost:5000/api/habits';
  const emojis = ['💪', '📚', '🏃', '🧘', '💻', '🎨', '🎯', '✍️', '🥗', '💧'];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();
      setHabits(data);
      setError('');
    } catch (err) {
      setError('Failed to load habits. Make sure the server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  const addHabit = async () => {
    if (newHabit.trim()) {
      try {
        const habit = {
          name: newHabit,
          emoji: selectedEmoji,
          completions: {}
        };
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(habit)
        });
        
        const savedHabit = await response.json();
        setHabits([...habits, savedHabit]);
        setNewHabit('');
        setError('');
      } catch (err) {
        setError('Failed to add habit');
        console.error(err);
      }
    }
  };

  const toggleCompletion = async (habitId, date) => {
    const dateKey = date.toISOString().split('T')[0];
    const habit = habits.find(h => h._id === habitId);
    
    const updatedCompletions = { ...habit.completions };
    updatedCompletions[dateKey] = !updatedCompletions[dateKey];
    
    try {
      const response = await fetch(`${API_URL}/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completions: updatedCompletions })
      });
      
      const updatedHabit = await response.json();
      setHabits(habits.map(h => h._id === habitId ? updatedHabit : h));
    } catch (err) {
      setError('Failed to update habit');
      console.error(err);
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      await fetch(`${API_URL}/${habitId}`, { method: 'DELETE' });
      setHabits(habits.filter(h => h._id !== habitId));
    } catch (err) {
      setError('Failed to delete habit');
      console.error(err);
    }
  };

  const getCompletionRate = (habit) => {
    const days = getDaysInMonth();
    const completed = days.filter(day => {
      const dateKey = day.toISOString().split('T')[0];
      return habit.completions?.[dateKey];
    }).length;
    return Math.round((completed / days.length) * 100);
  };

  const days = getDaysInMonth();
  const totalCompleted = habits.reduce((sum, habit) => {
    return sum + days.filter(day => {
      const dateKey = day.toISOString().split('T')[0];
      return habit.completions?.[dateKey];
    }).length;
  }, 0);

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  if (loading && habits.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <button 
            style={styles.menuButton}
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}

        {/* Header with Month Navigation */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.titleContainer}>
              <button 
                onClick={() => navigateMonth('prev')}
                style={styles.navButton}
              >
                <ChevronLeft size={isMobile ? 20 : 24} />
              </button>
              <h1 style={isMobile ? styles.titleMobile : styles.title}>
                <Calendar style={styles.titleIcon} size={isMobile ? 24 : 32} />
                {currentMonth.toLocaleDateString('en-US', { 
                  month: isMobile ? 'short' : 'long', 
                  year: 'numeric' 
                })}
              </h1>
              <button 
                onClick={() => navigateMonth('next')}
                style={styles.navButton}
              >
                <ChevronRight size={isMobile ? 20 : 24} />
              </button>
            </div>
            <div style={styles.statsContainer}>
              <div style={styles.statBox}>
                <div style={isMobile ? styles.statNumberMobile : styles.statNumber}>
                  {habits.length}
                </div>
                <div style={styles.statLabel}>Habits</div>
              </div>
              <div style={{...styles.statBox, ...styles.statBoxGreen}}>
                <div style={isMobile ? styles.statNumberMobile : styles.statNumber}>
                  {totalCompleted}
                </div>
                <div style={styles.statLabel}>Done</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Add Habit - Responsive */}
        <div style={styles.card}>
          <h2 style={isMobile ? styles.cardTitleMobile : styles.cardTitle}>
            <Plus size={isMobile ? 20 : 24} />
            Add New Habit
          </h2>
          <div style={styles.emojiContainer}>
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(emoji)}
                style={{
                  ...styles.emojiButton,
                  ...(isMobile ? styles.emojiButtonMobile : {}),
                  ...(selectedEmoji === emoji ? styles.emojiButtonActive : {})
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div style={isMobile ? styles.inputContainerMobile : styles.inputContainer}>
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              placeholder="Enter habit name..."
              style={isMobile ? styles.inputMobile : styles.input}
            />
            <button 
              onClick={addHabit} 
              style={isMobile ? styles.addButtonMobile : styles.addButton}
            >
              {isMobile ? '+' : 'Add Habit'}
            </button>
          </div>
        </div>

        {/* Habits Grid - Desktop with Combined Horizontal Scroll */}
        {!isMobile && (
          <div style={styles.card}>
            <div style={styles.gridContainer}>
              {/* Combined Scroll Container for Header and Habits */}
              <div style={styles.combinedScrollContainer}>
                {/* Header Row */}
                <div style={styles.gridHeader}>
                  <div style={styles.habitLabel}>
                    <TrendingUp size={20} style={{color: '#a78bfa'}} />
                    My Habits
                  </div>
                  <div style={styles.datesHeader}>
                    {days.map((day, idx) => (
                      <div key={idx} style={styles.dayHeader}>
                        <div style={styles.weekDay}>
                          {weekDays[day.getDay()]}
                        </div>
                        <div style={styles.dayNumber}>
                          {day.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={styles.progressLabel}>Progress</div>
                  <div style={styles.actionLabel}>Action</div>
                </div>

                {/* Habits Rows */}
                {habits.map(habit => {
                  const rate = getCompletionRate(habit);
                  return (
                    <div key={habit._id} style={styles.habitRow}>
                      {/* Habit Info - Fixed */}
                      <div style={styles.habitInfo}>
                        <span style={styles.habitEmoji}>{habit.emoji}</span>
                        <span style={styles.habitName}>{habit.name}</span>
                      </div>

                      {/* Dates and Checkboxes - Scrollable Together */}
                      <div style={styles.datesContainer}>
                        {days.map((day, idx) => {
                          const dateKey = day.toISOString().split('T')[0];
                          const isCompleted = habit.completions?.[dateKey];
                          return (
                            <button
                              key={idx}
                              onClick={() => toggleCompletion(habit._id, day)}
                              style={styles.checkboxButton}
                            >
                              <div 
                                style={isCompleted ? styles.checkboxCompleted : styles.checkbox}
                                className="checkbox"
                              >
                                {isCompleted && <CheckCircle2 size={20} style={{color: 'white'}} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Progress - Fixed */}
                      <div style={styles.progressContainer}>
                        <div style={styles.progressBar}>
                          <div style={{...styles.progressFill, width: `${rate}%`}} />
                        </div>
                        <span style={styles.progressText}>{rate}%</span>
                      </div>

                      {/* Delete Button - Fixed */}
                      <div style={styles.actionContainer}>
                        <button
                          onClick={() => deleteHabit(habit._id)}
                          style={styles.deleteButton}
                          title="Delete habit"
                        >
                          <Trash2 size={18} style={{color: '#f87171'}} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mobile View - Card Style */}
        {isMobile && (
          <div>
            {habits.map(habit => {
              const rate = getCompletionRate(habit);
              return (
                <div key={habit._id} style={styles.mobileCard}>
                  <div style={styles.mobileCardHeader}>
                    <div style={styles.mobileHabitInfo}>
                      <span style={styles.mobileEmoji}>{habit.emoji}</span>
                      <span style={styles.mobileHabitName}>{habit.name}</span>
                    </div>
                    <button
                      onClick={() => deleteHabit(habit._id)}
                      style={styles.mobileDeleteButton}
                    >
                      <Trash2 size={18} style={{color: '#f87171'}} />
                    </button>
                  </div>
                  
                  <div style={styles.mobileProgressContainer}>
                    <div style={styles.progressBar}>
                      <div style={{...styles.progressFill, width: `${rate}%`}} />
                    </div>
                    <span style={styles.progressText}>{rate}%</span>
                  </div>

                  <div style={styles.mobileScrollContainer}>
                    <div style={styles.mobileGrid}>
                      {days.map((day, idx) => {
                        const dateKey = day.toISOString().split('T')[0];
                        const isCompleted = habit.completions?.[dateKey];
                        return (
                          <div key={idx} style={styles.mobileDayContainer}>
                            <div style={styles.mobileDayLabel}>
                              {day.getDate()}
                            </div>
                            <button
                              onClick={() => toggleCompletion(habit._id, day)}
                              style={styles.mobileCheckboxButton}
                            >
                              <div style={isCompleted ? styles.mobileCheckboxCompleted : styles.mobileCheckbox}>
                                {isCompleted && <CheckCircle2 size={16} style={{color: 'white'}} />}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {habits.length === 0 && !loading && (
          <div style={styles.emptyState}>
            <Calendar size={isMobile ? 48 : 64} style={styles.emptyIcon} />
            <p style={isMobile ? styles.emptyTextMobile : styles.emptyText}>
              No habits yet. Add your first habit to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e293b 0%, #581c87 50%, #1e293b 100%)',
    padding: '10px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  wrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
  },
  loading: {
    color: 'white',
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
  menuButton: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: 'rgba(168, 85, 247, 0.9)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    color: 'white',
    cursor: 'pointer',
    zIndex: 1000,
    boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navButton: {
    background: 'rgba(168, 85, 247, 0.3)',
    border: 'none',
    borderRadius: '10px',
    padding: '8px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: 0,
    minWidth: '300px',
    justifyContent: 'center',
  },
  titleMobile: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
    minWidth: '180px',
    justifyContent: 'center',
  },
  titleIcon: {
    color: '#a78bfa',
  },
  statsContainer: {
    display: 'flex',
    gap: '12px',
  },
  statBox: {
    background: 'rgba(168, 85, 247, 0.2)',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    textAlign: 'center',
  },
  statBoxGreen: {
    background: 'rgba(34, 197, 94, 0.2)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
  },
  statNumberMobile: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#fca5a5',
    padding: '12px 20px',
    borderRadius: '12px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardTitleMobile: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  emojiContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  emojiButton: {
    fontSize: '24px',
    padding: '10px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  emojiButtonMobile: {
    fontSize: '20px',
    padding: '8px',
  },
  emojiButtonActive: {
    background: '#a855f7',
    transform: 'scale(1.1)',
    boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
  },
  inputContainer: {
    display: 'flex',
    gap: '12px',
  },
  inputContainerMobile: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  },
  inputMobile: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
  },
  addButton: {
    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    color: 'white',
    padding: '14px 28px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
  },
  addButtonMobile: {
    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: '600',
    fontSize: '18px',
    cursor: 'pointer',
    minWidth: '50px',
  },
  // Updated Grid Styles for Combined Horizontal Scroll
  gridContainer: {
    width: '100%',
  },
  combinedScrollContainer: {
    overflowX: 'auto',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  gridHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    minHeight: '50px',
    minWidth: 'max-content',
  },
  habitLabel: {
    width: '200px',
    fontWeight: '600',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    flexShrink: 0,
  },
  datesHeader: {
    display: 'flex',
    minWidth: 'max-content',
    height: '100%',
  },
  datesContainer: {
    display: 'flex',
    minWidth: 'max-content',
  },
  dayHeader: {
    width: '40px',
    textAlign: 'center',
    flexShrink: 0,
  },
  weekDay: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '12px',
    marginBottom: '4px',
  },
  dayNumber: {
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
  },
  progressLabel: {
    width: '100px',
    margin: '0 16px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    fontWeight: '600',
    flexShrink: 0,
  },
  actionLabel: {
    width: '60px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    fontWeight: '600',
    flexShrink: 0,
  },
  habitRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    minHeight: '60px',
    minWidth: 'max-content',
    '&:hover $deleteButton': {
      opacity: 1,
    },
  },
  habitInfo: {
    width: '200px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'white',
    flexShrink: 0,
  },
  habitEmoji: {
    fontSize: '24px',
  },
  habitName: {
    fontSize: '14px',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  checkboxButton: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  },
  checkbox: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(52, 211, 153, 0.5)',
    transform: 'scale(1.1)',
  },
  progressContainer: {
    width: '100px',
    margin: '0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  progressBar: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    height: '8px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
    transition: 'width 0.5s',
    borderRadius: '10px',
  },
  progressText: {
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    width: '40px',
    textAlign: 'right',
  },
  actionContainer: {
    width: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteButton: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    opacity: 0.7,
    '&:hover': {
      background: 'rgba(239, 68, 68, 0.3)',
      opacity: 1,
    },
  },
  // Mobile Card Styles (unchanged)
  mobileCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  mobileHabitInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  mobileEmoji: {
    fontSize: '28px',
  },
  mobileHabitName: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
  },
  mobileDeleteButton: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
  },
  mobileProgressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  mobileScrollContainer: {
    overflowX: 'auto',
    paddingBottom: '8px',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  mobileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))',
    gap: '8px',
    minWidth: 'max-content',
  },
  mobileDayContainer: {
    textAlign: 'center',
    minWidth: '45px',
  },
  mobileDayLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '11px',
    marginBottom: '4px',
    fontWeight: '600',
  },
  mobileCheckboxButton: {
    width: '100%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  mobileCheckbox: {
    width: '32px',
    height: '32px',
    margin: '0 auto',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileCheckboxCompleted: {
    width: '32px',
    height: '32px',
    margin: '0 auto',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(52, 211, 153, 0.5)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyIcon: {
    margin: '0 auto 16px',
    opacity: 0.3,
  },
  emptyText: {
    fontSize: '18px',
  },
  emptyTextMobile: {
    fontSize: '14px',
  },
};

export default HabitTrackerApp;