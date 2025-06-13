export interface Exam {
  id: number;
  title: string;
  description?: string;
  duration: number; // in minutes
  questions_count?: number;
  created_at: string;
  updated_at: string;
  questions?: Question[];
}

export interface Question {
  id: number;
  exam_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  points: number;
  created_at: string;
  updated_at: string;
  choices?: Choice[];
}

export interface Choice {
  id: number;
  question_id: number;
  choice_text: string;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamAttempt {
  id: number;
  exam_id: number;
  user_id: number;
  started_at: string;
  submitted_at?: string;
  score?: number;
  answers?: ExamAnswer[];
  created_at: string;
  updated_at: string;
  exam?: Exam;
}

export interface ExamAnswer {
  question_id: number;
  answer_value?: any; // Can be choice_id, boolean, or text
  selected_choice_id?: number;
  answer_text?: string;
}

export interface StartExamResponse {
  exam_attempt: ExamAttempt;
  exam: Exam;
}


