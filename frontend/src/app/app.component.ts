import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import axios, { AxiosInstance } from 'axios';

interface DbConfig {
  host: string,
  port: number,
  user: string,
  password: string,
  database: string,
  schema: string
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  dbConfig: DbConfig = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'postgres',
    schema: 'public'
  };

  sql: string = 'SELECT now()';
  result: any = null;
  error: string = '';
  databases: string[] = []; // список баз данных
  schemas: string[] = []; // список схем
  axios!: AxiosInstance;

  ngOnInit(): void {
    this.axios = axios.create({
      baseURL: 'http://localhost:5000'
    });
    const config = localStorage.getItem('config');
    if (config) {
      this.dbConfig = JSON.parse(config);
    }
    this.getDatabases();
  }

  saveConfig() {
    localStorage.setItem('config', JSON.stringify(this.dbConfig));
  }

  async runQuery() {
    try {
      this.error = '';
      const res = await this.axios.post('/api/query', {
        ...this.dbConfig,
        sql: this.sql
      });
      this.result = res.data;
    } catch (err: any) {
      this.error = err.response?.data?.error || err.message;
    }
  }

  async getDatabases() {
    this.databases = [];
    try {
      this.error = '';
      const res = await this.axios.post('/api/databases', {
        ...this.dbConfig,
      });
      this.databases = res.data as string[]; // массив имен баз
      if (!this.databases.includes(this.dbConfig.database)) {
        if (this.databases.length > 0) {
          this.dbConfig.database = this.databases[0];
        } else {
          this.dbConfig.database = '';
        }
      }
    } catch (err: any) {
      this.error = err.response?.data?.error || err.message;
    }
  }

  async loadSchemas() {
    if (!this.dbConfig.database) return;
  
    this.schemas = [];
    try {
      this.error = '';
      const res = await this.axios.post('/api/schemas', {
        ...this.dbConfig,
      });
      this.schemas = res.data;
      if (!this.schemas.includes(this.dbConfig.schema)) {
        if (this.schemas.length > 0) {
          this.dbConfig.schema = this.schemas[0];
        } else {
          this.dbConfig.schema = '';
        }
      }
    } catch (err: any) {
      this.error = err.response?.data?.error || err.message;
    }
  }
}
