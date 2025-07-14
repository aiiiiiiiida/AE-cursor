import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X as LucideX } from 'lucide-react';

type Question = {
  type: string;
  showDropdown: boolean;
  text: string;
  answers: string[];
  rows: string[];
  columns: string[];
};

const QUESTION_TYPES = [
  'Yes/No',
  'Single Choice',
  'Multiple Choice',
  'Multiple Choice Grid',
  'Free Text',
];

function ScreeningQuestionsModule({ value, onChange }: { value?: Question[]; onChange?: (questions: Question[]) => void } = {}) {
  const [internalQuestions, setInternalQuestions] = useState<Question[]>([
    {
      type: 'Single Choice',
      showDropdown: false,
      text: '',
      answers: ['', ''],
      rows: [''],
      columns: [''],
    },
  ]);
  const questions = value !== undefined ? value : internalQuestions;
  const setQuestions = (qs: Question[]) => {
    if (onChange) onChange(qs);
    else setInternalQuestions(qs);
  };

  // Add a localQuestions state for editing, and only commit changes onBlur or on add/remove
  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions);

  // Sync localQuestions with questions prop when it changes (but not while editing)
  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  // For all input onChange, update localQuestions only
  // For onBlur, call setQuestions(localQuestions)
  // For add/remove actions, update localQuestions and immediately call setQuestions

  // Example for question text input:
  // onChange={e => {
  //   const updated = localQuestions.map((q, i) => i === qIdx ? { ...q, text: e.target.value } : q);
  //   setLocalQuestions(updated);
  // }}
  // onBlur={() => setQuestions(localQuestions)}

  // Apply this pattern to all answer, row, column, and question text inputs
  // For add/remove, after updating localQuestions, also call setQuestions

  const isChoiceType = (type: string) => type === 'Single Choice' || type === 'Multiple Choice';
  const isGridType = (type: string) => type === 'Multiple Choice Grid';

  // Fix linter errors: setQuestions should always be called with a value, not a function
  const handleTypeClick = (qIdx: number) => {
    const newQuestions = questions.map((q, i) => ({
          type: q.type || 'Single Choice',
          showDropdown: i === qIdx ? !q.showDropdown : false,
          text: q.text || '',
          answers: Array.isArray(q.answers) ? q.answers : ['', ''],
          rows: Array.isArray(q.rows) && q.rows.length > 0 ? q.rows : [''],
          columns: Array.isArray(q.columns) && q.columns.length > 0 ? q.columns : [''],
    }));
    setQuestions(newQuestions);
  };

  const handleTypeSelect = (qIdx: number, type: string) => {
    const newQuestions = questions.map((q, i) => {
        if (i === qIdx) {
          return {
            type,
            showDropdown: false,
            text: q.text || '',
            answers: isChoiceType(type) ? ['', ''] : [],
            rows: isGridType(type) ? [''] : [''],
            columns: isGridType(type) ? [''] : [''],
          };
        } else {
          return {
            type: q.type || 'Single Choice',
            showDropdown: false,
            text: q.text || '',
            answers: Array.isArray(q.answers) ? q.answers : ['', ''],
            rows: Array.isArray(q.rows) && q.rows.length > 0 ? q.rows : [''],
            columns: Array.isArray(q.columns) && q.columns.length > 0 ? q.columns : [''],
          };
        }
    });
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (qIdx: number, value: string) => {
    const updated = localQuestions.map((q, i) => (i === qIdx ? { ...q, text: value } : q));
    setLocalQuestions(updated);
  };

  const handleAnswerChange = (qIdx: number, aIdx: number, value: string) => {
    const updated = localQuestions.map((q, i) =>
        i === qIdx
          ? { ...q, answers: q.answers.map((a, j) => (j === aIdx ? value : a)) }
          : q
    );
    setLocalQuestions(updated);
  };

  const handleAddAnswer = (qIdx: number) => {
    const updated = localQuestions.map((q, i) =>
        i === qIdx ? { ...q, answers: [...q.answers, ''] } : q
    );
    setLocalQuestions(updated);
    setQuestions(updated);
  };

  const handleAddQuestion = () => {
    const newQuestions = [
      ...questions,
      {
        type: 'Single Choice',
        showDropdown: false,
        text: '',
        answers: ['', ''],
        rows: [''],
        columns: [''],
      },
    ];
    setQuestions(newQuestions);
  };

  return (
    <div className="space-y-4">
      {localQuestions.map((q: Question, qIdx: number) => (
        <div key={qIdx} className="space-y-3 relative group">
          {localQuestions.length > 1 && (
            <button
              type="button"
              className="absolute top-0 right-0 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={() => {
                const newQuestions = localQuestions.filter((_: Question, i: number) => i !== qIdx);
                setLocalQuestions(newQuestions);
                setQuestions(newQuestions);
              }}
              tabIndex={-1}
            >
              <LucideX className="w-4 h-4" />
            </button>
          )}
          <div className="relative">
            <label
              className="block text-xs font-medium text-gray-700 mb-1 cursor-pointer select-none flex items-center"
              onClick={() => handleTypeClick(qIdx)}
            >
              {q.type} Question
              {q.showDropdown ? (
                <ChevronUp className="ml-1 w-4 h-4" />
              ) : (
                <ChevronDown className="ml-1 w-4 h-4" />
              )}
            </label>
            {q.showDropdown && (
              <div className="absolute z-10 mt-1 w-56 bg-white border rounded-xl shadow-lg">
                {QUESTION_TYPES.map((type: string) => (
                  <div
                    key={type}
                    className="px-4 py-2 hover:bg-gray-100 text-xs cursor-pointer"
                    onClick={() => handleTypeSelect(qIdx, type)}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
            <input
              className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] mt-2 placeholder:text-slate-500"
              placeholder="Question"
              value={q.text}
              onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
              onBlur={() => setQuestions(localQuestions)}
            />
          </div>
          {q.type === 'Yes/No' ? (
            <>
              <input
                className="w-full px-3 py-2 rounded-[10px] bg-[#F4F6FA] text-[13px] mt-2 placeholder:text-slate-500 border-0 focus:ring-0 focus:border-0"
                placeholder="Yes"
                value="Yes"
                disabled
                readOnly
              />
              <input
                className="w-full px-3 py-2 rounded-[10px] bg-[#F4F6FA] text-[13px] mt-2 placeholder:text-slate-500 border-0 focus:ring-0 focus:border-0"
                placeholder="No"
                value="No"
                disabled
                readOnly
              />
            </>
          ) : q.type === 'Free Text' ? null : isChoiceType(q.type) ? (
            <>
              {q.answers.map((a: string, aIdx: number) => (
                <div key={aIdx} className="relative flex items-center group mt-2">
                  <input
                    className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] placeholder:text-slate-500"
                    placeholder={`Answer ${aIdx + 1}`}
                    value={a}
                    onChange={(e) => handleAnswerChange(qIdx, aIdx, e.target.value)}
                    onBlur={() => setQuestions(localQuestions)}
                  />
                  {q.answers.length > 2 && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newQuestions = localQuestions.map((qq: Question, i: number) =>
                          i === qIdx ? { ...qq, answers: qq.answers.filter((_: string, idx: number) => idx !== aIdx) } : qq
                        );
                        setLocalQuestions(newQuestions);
                        setQuestions(newQuestions);
                      }}
                      tabIndex={-1}
                    >
                      <LucideX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="text-[#2927B2] font-medium text-xs mt-2 flex items-center"
                onClick={() => handleAddAnswer(qIdx)}
              >
                <Plus className="w-4 h-4 mr-1" /> Add answer
              </button>
            </>
          ) : isGridType(q.type) ? (
            <>
              <div className="flex gap-4 mt-2">
                {/* Rows column */}
                <div className="flex flex-col flex-1">
                  {q.rows.map((row: string, rIdx: number) => (
                    <div key={rIdx} className="relative flex items-center group mb-2 mt-2">
                      <input
                        className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] placeholder:text-slate-500"
                        placeholder="Type row"
                        value={row}
                        onChange={e => {
                          const newRows = [...q.rows];
                          newRows[rIdx] = e.target.value;
                          const updated = localQuestions.map((qq: Question, i: number) => i === qIdx ? { ...qq, rows: newRows } : qq);
                          setLocalQuestions(updated);
                        }}
                        onBlur={() => setQuestions(localQuestions)}
                      />
                      {q.rows.length > 1 && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newQuestions = localQuestions.map((qq: Question, i: number) =>
                              i === qIdx ? { ...qq, rows: qq.rows.filter((_: string, idx: number) => idx !== rIdx) } : qq
                            );
                            setLocalQuestions(newQuestions);
                            setQuestions(newQuestions);
                          }}
                          tabIndex={-1}
                        >
                          <LucideX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-[#2927B2] font-medium text-xs flex items-center mt-1"
                    onClick={() => {
                      const newQuestions = localQuestions.map((qq: Question, i: number) => i === qIdx ? { ...qq, rows: [...qq.rows, ''] } : qq);
                      setLocalQuestions(newQuestions);
                      setQuestions(newQuestions);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Row
                  </button>
                </div>
                {/* Columns column */}
                <div className="flex flex-col flex-1">
                  {q.columns.map((col: string, cIdx: number) => (
                    <div key={cIdx} className="relative flex items-center group mb-2 mt-2">
                      <input
                        className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] placeholder:text-slate-500"
                        placeholder="Type column"
                        value={col}
                        onChange={e => {
                          const newCols = [...q.columns];
                          newCols[cIdx] = e.target.value;
                          const updated = localQuestions.map((qq: Question, i: number) => i === qIdx ? { ...qq, columns: newCols } : qq);
                          setLocalQuestions(updated);
                        }}
                        onBlur={() => setQuestions(localQuestions)}
                      />
                      {q.columns.length > 1 && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newQuestions = localQuestions.map((qq: Question, i: number) =>
                              i === qIdx ? { ...qq, columns: qq.columns.filter((_: string, idx: number) => idx !== cIdx) } : qq
                            );
                            setLocalQuestions(newQuestions);
                            setQuestions(newQuestions);
                          }}
                          tabIndex={-1}
                        >
                          <LucideX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-[#2927B2] font-medium text-xs flex items-center mt-1"
                    onClick={() => {
                      const newQuestions = localQuestions.map((qq: Question, i: number) => i === qIdx ? { ...qq, columns: [...qq.columns, ''] } : qq);
                      setLocalQuestions(newQuestions);
                      setQuestions(newQuestions);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Column
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {q.answers.map((a: string, aIdx: number) => (
                <input
                  key={aIdx}
                  className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] mt-2 placeholder:text-slate-500"
                  placeholder={`Answer ${aIdx + 1}`}
                  value={a}
                  onChange={(e) => handleAnswerChange(qIdx, aIdx, e.target.value)}
                  onBlur={() => setQuestions(localQuestions)}
                />
              ))}
              <button
                type="button"
                className="text-[#2927B2] font-medium text-xs mt-2 flex items-center"
                onClick={() => handleAddAnswer(qIdx)}
              >
                <Plus className="w-4 h-4 mr-1" /> Add answer
              </button>
            </>
          )}
        </div>
      ))}
      <button
        type="button"
        className="text-[#2927B2] font-medium text-xs flex items-center"
        onClick={handleAddQuestion}
      >
        <Plus className="w-4 h-4 mr-1" /> Add question
      </button>
    </div>
  );
}

export default ScreeningQuestionsModule; 