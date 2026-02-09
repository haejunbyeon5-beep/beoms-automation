import React from 'react';
import { UiStep } from '../types';
import { FileText, Users, Film, Scissors, Zap } from 'lucide-react';

interface Props {
  currentStep: UiStep;
  onStepClick: (step: UiStep) => void;
  completedSteps: UiStep[];
}

const STEPS: { id: UiStep; label: string; icon: React.FC<any> }[] = [
  { id: 'analysis', label: '대본 분석', icon: FileText },
  { id: 'characters', label: '캐릭터 정의', icon: Users },
  { id: 'scenes', label: '장면 분할', icon: Film },
  { id: 'cuts', label: '컷 배분', icon: Scissors },
  { id: 'generate', label: '생성', icon: Zap },
];

export const StepProgressBar: React.FC<Props> = ({ currentStep, onStepClick, completedSteps }) => {
  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex-1 flex items-center">
                <button
                  onClick={() => onStepClick(step.id)}
                  className={`flex flex-col items-center group w-full relative focus:outline-none`}
                >
                   <div className={`
                     w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 border-2
                     ${isActive 
                       ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-110' 
                       : isCompleted 
                         ? 'bg-white border-orange-500 text-orange-500' 
                         : 'bg-white border-gray-200 text-gray-300 group-hover:border-gray-300'}
                   `}>
                     <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                   </div>
                   <span className={`text-[10px] mt-1 font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                     {step.label}
                   </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors duration-500 ${isCompleted ? 'bg-orange-200' : 'bg-gray-100'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};