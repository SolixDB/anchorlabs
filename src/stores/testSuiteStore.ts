import { create, StateCreator } from "zustand";
import { persist } from "zustand/middleware";

export interface TestCase {
  id: string;
  name: string;
  instruction: string;
  args: Record<string, unknown>;
  accounts: Record<string, string>;
  expectedOutcome?: "success" | "failure";
  description?: string;
  createdAt: number;
}

export interface TestSuite {
  id: string;
  name: string;
  programId: string;
  testCases: TestCase[];
  createdAt: number;
  updatedAt: number;
}

interface TestSuiteState {
  suites: TestSuite[];
  currentSuiteId: string | null;
  
  // Suite operations
  createSuite: (name: string, programId: string) => string;
  updateSuite: (id: string, updates: Partial<TestSuite>) => void;
  deleteSuite: (id: string) => void;
  setCurrentSuite: (id: string | null) => void;
  getCurrentSuite: () => TestSuite | null;
  
  // Test case operations
  addTestCase: (suiteId: string, testCase: Omit<TestCase, "id" | "createdAt">) => void;
  updateTestCase: (suiteId: string, testCaseId: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (suiteId: string, testCaseId: string) => void;
  getTestCase: (suiteId: string, testCaseId: string) => TestCase | null;
}

const creator: StateCreator<TestSuiteState> = (set, get) => ({
      suites: [],
      currentSuiteId: null,
      createSuite: (name, programId) => {
        const id = `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newSuite: TestSuite = {
          id,
          name,
          programId,
          testCases: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ suites: [...state.suites, newSuite] }));
        return id;
      },

      updateSuite: (id, updates) => {
        set((state) => ({
          suites: state.suites.map((suite) =>
            suite.id === id
              ? { ...suite, ...updates, updatedAt: Date.now() }
              : suite
          ),
        }));
      },

      deleteSuite: (id) => {
        set((state) => ({
          suites: state.suites.filter((suite) => suite.id !== id),
          currentSuiteId: state.currentSuiteId === id ? null : state.currentSuiteId,
        }));
      },

      setCurrentSuite: (id) => set({ currentSuiteId: id }),

      getCurrentSuite: () => {
        const { suites, currentSuiteId } = get();
        return suites.find((s) => s.id === currentSuiteId) || null;
      },

      addTestCase: (suiteId, testCase) => {
        const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTestCase: TestCase = { ...testCase, id, createdAt: Date.now() };
        set((state) => ({
          suites: state.suites.map((suite) =>
            suite.id === suiteId
              ? {
                  ...suite,
                  testCases: [...suite.testCases, newTestCase],
                  updatedAt: Date.now(),
                }
              : suite
          ),
        }));
      },

      updateTestCase: (suiteId, testCaseId, updates) => {
        set((state) => ({
          suites: state.suites.map((suite) =>
            suite.id === suiteId
              ? {
                  ...suite,
                  testCases: suite.testCases.map((tc) =>
                    tc.id === testCaseId ? { ...tc, ...updates } : tc
                  ),
                  updatedAt: Date.now(),
                }
              : suite
          ),
        }));
      },

      deleteTestCase: (suiteId, testCaseId) => {
        set((state) => ({
          suites: state.suites.map((suite) =>
            suite.id === suiteId
              ? {
                  ...suite,
                  testCases: suite.testCases.filter((tc) => tc.id !== testCaseId),
                  updatedAt: Date.now(),
                }
              : suite
          ),
        }));
      },

      getTestCase: (suiteId, testCaseId) => {
        const suite = get().suites.find((s) => s.id === suiteId);
        return suite?.testCases.find((tc) => tc.id === testCaseId) || null;
      },
});

const useTestSuiteStore = create<TestSuiteState>()(
  persist(creator, {
    name: "test-suite-storage",
  }) as unknown as StateCreator<TestSuiteState, [], [never, unknown][]>
);

export default useTestSuiteStore;