export interface Problem {
  id: string;
  title: string;
  author: string;
  tags: number[];
  accept: number;
  attempt: number;
  description?: string;
  hint?: string;
}

export interface ProblemView {
  id: string;
  title: string;
  author: string;
  tags: string[];
  accept: number;
  attempt: number;
  description?: string;
  hint?: string;
}

export interface ProblemTag {
  id: number;
  name: string;
}
