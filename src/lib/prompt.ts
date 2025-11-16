// ============================================
// SYSTEM PROMPT (Load from environment variable)
// ============================================

export const ANCHOR_TEST_GENERATOR_PROMPT = process.env.NEXT_PUBLIC_ANCHOR_TEST_GENERATOR_PROMPT || "";

// ============================================
// GEMINI INTEGRATION
// ============================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import useProgramStore from "@/stores/programStore";

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

export interface SeedDefinition {
  type: 'string' | 'publicKey' | 'u64' | 'i64' | 'u32' | 'i32' | 'u16' | 'i16' | 'u8' | 'i8';
  value?: string | number;
  source?: string;
}

export interface PDASeeds {
  [pdaName: string]: {
    seeds: SeedDefinition[];
    description: string;
  };
}

export interface TestGeneratorInput {
  idl: Record<string, unknown>; // Anchor IDL object
  seeds: PDASeeds;
  context?: {
    tokenProgram?: 'spl-token' | 'spl-token-2022' | null;
    specialRequirements?: string;
  };
}

export interface TestGeneratorOutput {
  testCode: string;
  dependencies: {
    required: string[];
    optional: string[];
    devDependencies: string[];
  };
  seedsUsed: Record<string, string[]>;
  instructions: string[];
}

export interface GenerateTestOptions {
  seeds: PDASeeds;
  context?: {
    tokenProgram?: 'spl-token' | 'spl-token-2022' | null;
    specialRequirements?: string;
  };
  apiKey?: string; // Optional: can also use env variable
}

// ============================================
// MAIN TEST GENERATOR CLASS
// ============================================

export class AnchorTestGenerator {
  private readonly systemPrompt: string;
  private genAI: GoogleGenerativeAI | null = null;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

  constructor(apiKey?: string) {
    this.systemPrompt = ANCHOR_TEST_GENERATOR_PROMPT;

    if (!this.systemPrompt) {
      console.warn('⚠️  ANCHOR_TEST_GENERATOR_PROMPT not found in environment variables');
    }

    // Initialize Gemini
    const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      // Use free/fast model
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Extract IDL from programStore
   */
  private getIdlFromStore(): Record<string, unknown> {
    const { programDetails } = useProgramStore.getState();

    if (!programDetails) {
      throw new Error('No program initialized in store. Please initialize a program first.');
    }

    try {
      const idl = JSON.parse(programDetails.serializedIdl);
      console.log('✓ IDL extracted from program store:', idl.metadata?.name || idl.name);
      return idl;
    } catch (error) {
      throw new Error(`Failed to parse IDL from store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format input for LLM
   */
  formatInput(input: TestGeneratorInput): string {
    return JSON.stringify(input, null, 2);
  }

  /**
   * Parse LLM output
   */
  parseOutput(response: string): TestGeneratorOutput {
    try {
      // Remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const parsed = JSON.parse(cleanResponse);

      // Validate required fields
      if (!parsed.testCode || !parsed.dependencies) {
        throw new Error('Invalid response format: missing required fields (testCode, dependencies)');
      }

      return {
        testCode: parsed.testCode,
        dependencies: {
          required: parsed.dependencies.required || [],
          optional: parsed.dependencies.optional || [],
          devDependencies: parsed.dependencies.devDependencies || [],
        },
        seedsUsed: parsed.seedsUsed || {},
        instructions: parsed.instructions || [],
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse LLM response: ${error.message}`);
      }
      throw new Error('Failed to parse LLM response');
    }
  }

  /**
   * Generate test file using Gemini
   */
  async generateTest(options: GenerateTestOptions): Promise<TestGeneratorOutput> {
    if (!this.model) {
      throw new Error('Gemini API not initialized. Please provide GEMINI_API_KEY.');
    }

    if (!this.systemPrompt) {
      throw new Error('System prompt not loaded. Please set ANCHOR_TEST_GENERATOR_PROMPT in environment.');
    }

    console.log('\n🤖 Generating test file with Gemini...\n');

    try {
      // Get IDL from program store
      const idl = this.getIdlFromStore();

      // Prepare input
      const input: TestGeneratorInput = {
        idl,
        seeds: options.seeds,
        context: options.context || {
          tokenProgram: null,
          specialRequirements: 'None'
        }
      };

      const formattedInput = this.formatInput(input);

      console.log('📤 Sending request to Gemini...');
      const programName = (idl as any).metadata?.name ?? (idl as any).name ?? 'Unknown';
      const instructionsCount = Array.isArray((idl as any).instructions) ? (idl as any).instructions.length : 0;
      console.log('   Program:', programName);
      console.log('   Instructions:', instructionsCount);
      console.log('   PDAs:', Object.keys(options.seeds || {}).length);

      // Call Gemini API
      const result = await this.model.generateContent([
        { text: this.systemPrompt },
        { text: `\n\nGenerate test code for the following Anchor program:\n\n${formattedInput}` }
      ]);

      const response = await result.response;
      const text = response.text();

      console.log('✓ Received response from Gemini');

      // Parse the output
      const output = this.parseOutput(text);

      console.log('✓ Test generation complete!\n');

      return output;

    } catch (error) {
      if (error instanceof Error) {
        console.error('✗ Test generation failed:', error.message);
        throw new Error(`Test generation failed: ${error.message}`);
      }
      throw new Error('Test generation failed with unknown error');
    }
  }

  /**
   * Generate installation command
   */
  generateInstallCommand(dependencies: TestGeneratorOutput['dependencies']): string {
    const allDeps = [
      ...dependencies.required,
      ...dependencies.optional,
    ].join(' ');

    const devDeps = dependencies.devDependencies.join(' ');

    let command = '';
    if (allDeps) {
      command += `npm install ${allDeps}`;
    }
    if (devDeps) {
      command += allDeps ? ' && ' : '';
      command += `npm install --save-dev ${devDeps}`;
    }

    return command || 'No dependencies to install';
  }

  /**
   * Display output in console
   */
  displayOutput(output: TestGeneratorOutput): void {
    console.log('\n✅ Test Generation Complete!\n');
    console.log('━'.repeat(50));

    console.log('\n📦 Dependencies Required:');
    console.log('  Required:', output.dependencies.required.join(', ') || 'None');
    if (output.dependencies.optional.length > 0) {
      console.log('  Optional:', output.dependencies.optional.join(', '));
    }
    if (output.dependencies.devDependencies.length > 0) {
      console.log('  Dev:', output.dependencies.devDependencies.join(', '));
    }

    console.log('\n🔧 Installation Command:');
    console.log('  ' + this.generateInstallCommand(output.dependencies));

    if (Object.keys(output.seedsUsed).length > 0) {
      console.log('\n🌱 PDAs Generated:');
      Object.entries(output.seedsUsed).forEach(([pda, seeds]) => {
        console.log(`  ${pda}: [${seeds.join(', ')}]`);
      });
    }

    console.log('\n📋 Setup Instructions:');
    output.instructions.forEach((instruction, i) => {
      console.log(`  ${i + 1}. ${instruction}`);
    });

    console.log('\n━'.repeat(50));
    console.log('📄 Test file ready to use!\n');
  }

  /**
   * Save test file to disk
   */
  // async saveTestFile(output: TestGeneratorOutput, filePath: string): Promise<void> {
  //   const fs = await import('fs/promises');
  //   try {
  //     await fs.writeFile(filePath, output.testCode, 'utf-8');
  //     console.log(`✓ Test file saved to: ${filePath}`);
  //   } catch (error) {
  //     throw new Error(`Failed to save test file: ${error instanceof Error ? error.message : String(error)}`);
  //   }
  // }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Quick generate test from program store
 */
export async function generateTestFromStore(
  seeds: PDASeeds,
  context?: {
    tokenProgram?: 'spl-token' | 'spl-token-2022' | null;
    specialRequirements?: string;
  },
  apiKey?: string
): Promise<TestGeneratorOutput> {
  const generator = new AnchorTestGenerator(apiKey);
  return await generator.generateTest({ seeds, context });
}

/**
 * Generate and save test file
 */
// export async function generateAndSaveTest(
//   seeds: PDASeeds,
//   outputPath: string,
//   context?: {
//     tokenProgram?: 'spl-token' | 'spl-token-2022' | null;
//     specialRequirements?: string;
//   },
//   apiKey?: string
// ): Promise<TestGeneratorOutput> {
//   const generator = new AnchorTestGenerator(apiKey);
//   const output = await generator.generateTest({ seeds, context });
//   await generator.saveTestFile(output, outputPath);
//   generator.displayOutput(output);
//   return output;
// }

// ============================================
// EXAMPLE USAGE
// ============================================

export async function exampleUsage() {
  try {
    // Note: Assumes program is already initialized in programStore
    const generator = new AnchorTestGenerator();

    // Define your PDAs
    const seeds: PDASeeds = {
      dataAccount: {
        seeds: [
          { type: "string", value: "data" },
          { type: "publicKey", source: "user" }
        ],
        description: "User's data account PDA"
      },
      vaultAccount: {
        seeds: [
          { type: "string", value: "vault" },
          { type: "publicKey", source: "mint" }
        ],
        description: "Token vault PDA"
      }
    };

    // Optional context
    const context = {
      tokenProgram: 'spl-token' as const,
      specialRequirements: 'Uses token accounts for staking'
    };

    // Generate test
    const output = await generator.generateTest({ seeds, context });

    // Display results
    generator.displayOutput(output);

    // Optionally save to file
    // await generator.saveTestFile(output, './tests/generated-test.ts');

    return output;

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Export default
export default AnchorTestGenerator;