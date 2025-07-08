import React, { useState } from 'react';
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

function ScreeningQuestionsModule() {
  const [questions, setQuestions] = useState<Question[]>([
    {
      type: 'Single Choice',
      showDropdown: false,
      text: '',
      answers: ['', ''],
      rows: [''], // For grid
      columns: [''], // For grid
    },
  ]);

  const isChoiceType = (type: string) => type === 'Single Choice' || type === 'Multiple Choice';
  const isGridType = (type: string) => type === 'Multiple Choice Grid';

  const handleTypeClick = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        return {
          type: q.type || 'Single Choice',
          showDropdown: i === qIdx ? !q.showDropdown : false,
          text: q.text || '',
          answers: Array.isArray(q.answers) ? q.answers : ['', ''],
          rows: Array.isArray(q.rows) && q.rows.length > 0 ? q.rows : [''],
          columns: Array.isArray(q.columns) && q.columns.length > 0 ? q.columns : [''],
        };
      })
    );
  };

  const handleTypeSelect = (qIdx: number, type: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
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
      })
    );
  };

  const handleQuestionChange = (qIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, text: value } : q))
    );
  };

  const handleAnswerChange = (qIdx: number, aIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, answers: q.answers.map((a, j) => (j === aIdx ? value : a)) }
          : q
      )
    );
  };

  const handleAddAnswer = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, answers: [...q.answers, ''] } : q
      )
    );
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        type: 'Single Choice',
        showDropdown: false,
        text: '',
        answers: ['', ''],
        rows: [''],
        columns: [''],
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="space-y-3 relative group">
          {questions.length > 1 && (
            <button
              type="button"
              className="absolute top-0 right-0 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={() => {
                setQuestions(prev => prev.filter((_, i) => i !== qIdx));
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
                {QUESTION_TYPES.map((type) => (
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
              {q.answers.map((a, aIdx) => (
                <div key={aIdx} className="relative flex items-center group mt-2">
                  <input
                    className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] placeholder:text-slate-500"
                    placeholder={`Answer ${aIdx + 1}`}
                    value={a}
                    onChange={(e) => handleAnswerChange(qIdx, aIdx, e.target.value)}
                  />
                  {q.answers.length > 2 && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setQuestions(prev => prev.map((qq, i) =>
                          i === qIdx ? { ...qq, answers: qq.answers.filter((_, idx) => idx !== aIdx) } : qq
                        ));
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
                  {q.rows.map((row, rIdx) => (
                    <div key={rIdx} className="relative flex items-center group mb-2 mt-2">
                      <input
                        className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] placeholder:text-slate-500"
                        placeholder="Type row"
                        value={row}
                        onChange={e => {
                          const newRows = [...q.rows];
                          newRows[rIdx] = e.target.value;
                          setQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, rows: newRows } : qq));
                        }}
                      />
                      {q.rows.length > 1 && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setQuestions(prev => prev.map((qq, i) =>
                              i === qIdx ? { ...qq, rows: qq.rows.filter((_, idx) => idx !== rIdx) } : qq
                            ));
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
                      setQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, rows: [...qq.rows, ''] } : qq));
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Row
                  </button>
                </div>
                {/* Columns column */}
                <div className="flex flex-col flex-1">
                  {q.columns.map((col, cIdx) => (
                    <div key={cIdx} className="relative flex items-center group mb-2 mt-2">
                      <input
                        className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] placeholder:text-slate-500"
                        placeholder="Type column"
                        value={col}
                        onChange={e => {
                          const newCols = [...q.columns];
                          newCols[cIdx] = e.target.value;
                          setQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, columns: newCols } : qq));
                        }}
                      />
                      {q.columns.length > 1 && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setQuestions(prev => prev.map((qq, i) =>
                              i === qIdx ? { ...qq, columns: qq.columns.filter((_, idx) => idx !== cIdx) } : qq
                            ));
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
                      setQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, columns: [...qq.columns, ''] } : qq));
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Column
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {q.answers.map((a, aIdx) => (
                <input
                  key={aIdx}
                  className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] mt-2 placeholder:text-slate-500"
                  placeholder={`Answer ${aIdx + 1}`}
                  value={a}
                  onChange={(e) => handleAnswerChange(qIdx, aIdx, e.target.value)}
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