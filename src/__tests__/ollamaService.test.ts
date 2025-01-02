import axios from 'axios';
import { OllamaService } from '../services/ollamaService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OllamaService', () => {
    let ollamaService: OllamaService;

    beforeEach(() => {
        // 创建新的服务实例
        ollamaService = new OllamaService();
        // 清除所有模拟
        jest.clearAllMocks();
    });

    describe('generateCompletion', () => {
        it('should successfully generate completion', async () => {
            // 模拟成功的API响应
            const mockResponse = {
                data: {
                    response: 'Generated code completion'
                }
            };
            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            // 测试生成补全
            const prompt = 'Write a function that';
            const result = await ollamaService.generateCompletion(prompt);

            // 验证结果
            expect(result).toBe('Generated code completion');
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:11434/api/generate',
                {
                    model: 'codellama',
                    prompt: prompt,
                    stream: false
                }
            );
        });

        it('should handle API error', async () => {
            // 模拟API错误
            mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

            // 测试错误处理
            const prompt = 'Write a function that';
            await expect(ollamaService.generateCompletion(prompt))
                .rejects
                .toThrow('Failed to generate completion from Ollama');
        });
    });

    describe('streamCompletion', () => {
        it('should handle streaming response', async () => {
            // 创建模拟的流响应
            const mockStream = {
                data: [
                    Buffer.from(JSON.stringify({ response: 'Part 1' })),
                    Buffer.from(JSON.stringify({ response: 'Part 2' }))
                ]
            };
            mockedAxios.post.mockResolvedValueOnce(mockStream);

            // 创建模拟的回调函数
            const onToken = jest.fn();

            // 测试流式补全
            await ollamaService.streamCompletion('Stream test', onToken);

            // 验证回调被正确调用
            expect(onToken).toHaveBeenCalledWith('Part 1');
            expect(onToken).toHaveBeenCalledWith('Part 2');
            expect(onToken).toHaveBeenCalledTimes(2);
        });

        it('should handle streaming error', async () => {
            // 模拟流错误
            mockedAxios.post.mockRejectedValueOnce(new Error('Stream Error'));

            const onToken = jest.fn();
            await expect(ollamaService.streamCompletion('Stream test', onToken))
                .rejects
                .toThrow('Failed to stream completion from Ollama');
        });
    });

    describe('updateConfig', () => {
        it('should update configuration', () => {
            const newConfig = {
                baseUrl: 'http://localhost:8080',
                model: 'gpt4'
            };

            ollamaService.updateConfig(newConfig);

            // 测试下一次请求是否使用了新的配置
            const prompt = 'Test prompt';
            ollamaService.generateCompletion(prompt);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8080/api/generate',
                expect.objectContaining({
                    model: 'gpt4',
                    prompt: prompt
                })
            );
        });
    });
});
