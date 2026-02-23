
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Função simples para carregar .env manualmente
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length === 2) {
                process.env[parts[0].trim()] = parts[1].trim();
            }
        });
    } catch (err) {
        console.warn('Aviso: Não foi possível carregar o arquivo .env');
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERRO: Credenciais do Supabase não encontradas no .env');
    console.log('Valores encontrados:');
    console.log('URL:', supabaseUrl);
    console.log('KEY:', supabaseAnonKey ? '***' : 'null');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('Testando conexão com Supabase...');
    console.log('URL:', supabaseUrl);

    try {
        // Testar leitura da tabela inventory_data
        const { data, error, count } = await supabase
            .from('inventory_data')
            .select('*', { count: 'exact' });

        if (error) {
            console.error('Erro ao acessar tabela inventory_data:', error.message);
        } else {
            console.log('✅ Conexão bem sucedida com inventory_data!');
            console.log(`Total de registros: ${count}`);
            if (data && data.length > 0) {
                console.log('Tipos de ferramentas encontradas:', [...new Set(data.map(i => i.tool_name))].join(', '));
            } else {
                console.log('Nenhum dado encontrado na tabela inventory_data.');
            }
        }

        // Testar leitura da tabela terminated_employees
        const { count: empCount, error: empError } = await supabase
            .from('terminated_employees')
            .select('*', { count: 'exact', head: true });

        if (empError) {
            console.error('Erro ao acessar tabela terminated_employees:', empError.message);
        } else {
            console.log('✅ Conexão bem sucedida com terminated_employees!');
            console.log(`Total de desligados: ${empCount}`);
        }

    } catch (err) {
        console.error('Erro inesperado:', err.message);
    }
}

testConnection();
