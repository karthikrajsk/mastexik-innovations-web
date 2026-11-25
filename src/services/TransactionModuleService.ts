// services/TransactionModuleService.ts - FIXED VERSION
import apiService from "./ApiService";

export interface TransactionModuleField {
  name: string;
  label: string;
  type?: string;
  tableName?: string;
  databaseColumnName?: string;
  dataType?: string;
  isRelation?: boolean;
  relationTableName?: string;
  relationColumnName?: string;
  relationDisplayColumn?: string;
}

export interface TransactionModuleSection {
  name: string;
  label: string;
  fields: TransactionModuleField[];
}

export interface TransactionModule {
  id: string;
  name: string;
  displayName: string;
  sections: TransactionModuleSection[];
  description?: string;
}

class TransactionModuleServiceClass {
  private baseUrl = "module-field-mappings";

  async loadModules(): Promise<TransactionModule[]> {
    try {
      console.log("🚀 TransactionModuleService.loadModules() called");
      console.log("   Full endpoint:", `${this.baseUrl}/structure`);
      
      const response = await apiService.get(`${this.baseUrl}/structure`);
      console.log("📦 API response:", response);

      const structureData = response?.data || response;
      
      if (!structureData) {
        console.error("❌ No structure data returned");
        return [];
      }

      if (!structureData.modules || structureData.modules.length === 0) {
        console.error("❌ No modules in response:", structureData);
        return [];
      }

      console.log("✅ Modules found:", structureData.modules);
      return this.transformStructure(structureData);

    } catch (error) {
      console.error("❌ Failed to load modules:", error);
      if (error instanceof Error) {
        console.error("   Error:", error.message);
      }
      return [];
    }
  }

  async loadDynamicModules(): Promise<TransactionModule[]> {
    try {
      console.log("🚀 Loading dynamic modules from database schema...");
      const response = await apiService.get(`${this.baseUrl}/dynamic-structure`);
      console.log("📦 Raw dynamic structure response:", response);

      // Extract data properly
      const structureData = response?.data || response;
      
      // Handle success wrapper - create new variable
      const processedData = structureData && structureData.status === 'success' && structureData.data 
        ? structureData.data 
        : structureData;

      console.log("📊 Processed dynamic structure:", processedData);

      if (!processedData) {
        console.error("❌ No dynamic structure data found");
        return [];
      }

      return this.transformDynamicStructure(processedData);

    } catch (error) {
      console.error("❌ Failed to load dynamic modules:", error);
      return [];
    }
  }

  private transformStructure(structureData: any): TransactionModule[] {
    const modules: TransactionModule[] = [];
    const moduleNames: string[] = structureData.modules || [];
    const sectionsMap: Record<string, string[]> = structureData.sections || {};
    const fieldsMap: Record<string, Record<string, any[]>> = structureData.fields || {};

    console.log("🔍 Data analysis:", {
      moduleCount: moduleNames.length,
      moduleNames: moduleNames,
      sectionsMapKeys: Object.keys(sectionsMap),
      fieldsMapKeys: Object.keys(fieldsMap)
    });

    for (const moduleName of moduleNames) {
      console.log(`🏗️ Building module: ${moduleName}`);
      
      const module: TransactionModule = {
        id: this.generateId(moduleName),
        name: moduleName,
        displayName: this.formatDisplayName(moduleName),
        sections: []
      };

      const sectionNames = sectionsMap[moduleName] || [];
      console.log(`   📁 Sections for ${moduleName}:`, sectionNames);

      for (const sectionName of sectionNames) {
        console.log(`   🛠️ Building section: ${sectionName}`);
        
        const section: TransactionModuleSection = {
          name: sectionName,
          label: this.formatDisplayName(sectionName),
          fields: []
        };

        const fieldsData = fieldsMap[moduleName]?.[sectionName] || [];
        console.log(`   📄 Fields data for ${moduleName}.${sectionName}:`, fieldsData.length);

        section.fields = fieldsData.map((field: any, index: number) => {
          const fieldObj: TransactionModuleField = {
            name: field.fieldName || field.name || `field_${index}`,
            label: field.fieldLabel || field.label || this.formatDisplayName(field.fieldName || field.name || `Field ${index}`),
            tableName: field.tableName,
            databaseColumnName: field.databaseColumnName,
            dataType: field.dataType,
            isRelation: field.isRelation || false,
            relationTableName: field.relationTableName,
            relationColumnName: field.relationColumnName,
            relationDisplayColumn: field.relationDisplayColumn,
            type: this.mapDataTypeToFieldType(field.dataType)
          };
          
          console.log(`      ✅ Field ${index}:`, fieldObj.name);
          return fieldObj;
        });

        console.log(`   ✅ Section ${sectionName} has ${section.fields.length} fields`);
        module.sections.push(section);
      }

      console.log(`✅ Module ${moduleName} completed with ${module.sections.length} sections`);
      modules.push(module);
    }

    console.log("🎉 Final modules built:", modules.length);
    return modules;
  }

  private transformDynamicStructure(structureData: any): TransactionModule[] {
    const modules: TransactionModule[] = [];
    const moduleNames: string[] = structureData.modules || [];
    const sectionsMap: Record<string, string[]> = structureData.sections || {};
    const fieldsMap: Record<string, Record<string, any[]>> = structureData.fields || {};

    console.log("🔍 Dynamic data analysis:", {
      moduleCount: moduleNames.length,
      sectionsMapKeys: Object.keys(sectionsMap),
      fieldsMapKeys: Object.keys(fieldsMap)
    });

    for (const moduleName of moduleNames) {
      console.log(`🏗️ Building dynamic module: ${moduleName}`);
      
      const module: TransactionModule = {
        id: this.generateId(moduleName),
        name: moduleName,
        displayName: this.formatDisplayName(moduleName),
        sections: []
      };

      const sectionNames = sectionsMap[moduleName] || [];
      console.log(`   📁 Dynamic sections for ${moduleName}:`, sectionNames);

      for (const sectionName of sectionNames) {
        console.log(`   🛠️ Building dynamic section: ${sectionName}`);
        
        const section: TransactionModuleSection = {
          name: sectionName,
          label: this.formatDisplayName(sectionName),
          fields: []
        };

        const fieldsData = fieldsMap[moduleName]?.[sectionName] || [];
        console.log(`   📄 Dynamic fields for ${moduleName}.${sectionName}:`, fieldsData.length);

        section.fields = fieldsData.map((field: any, index: number) => {
          const fieldObj: TransactionModuleField = {
            name: field.fieldName,
            label: field.fieldLabel,
            tableName: field.tableName,
            databaseColumnName: field.databaseColumnName,
            dataType: field.dataType,
            isRelation: field.isRelation || false,
            relationTableName: field.relationTableName,
            relationColumnName: field.relationColumnName,
            relationDisplayColumn: field.relationDisplayColumn,
            type: this.mapDataTypeToFieldType(field.dataType)
          };
          
          console.log(`      ✅ Dynamic field ${index}:`, fieldObj.name);
          return fieldObj;
        });

        console.log(`   ✅ Dynamic section ${sectionName} has ${section.fields.length} fields`);
        module.sections.push(section);
      }

      console.log(`✅ Dynamic module ${moduleName} completed with ${module.sections.length} sections`);
      modules.push(module);
    }

    return modules;
  }

  async getAllModuleNames(): Promise<{ value: string; label: string }[]> {
    try {
      console.log("🔍 Fetching module names from API...");
      const response = await apiService.get(`${this.baseUrl}/modules`);
      console.log("📦 Raw modules response:", response);

      // Extract data properly
      const responseData = response?.data || response;
      
      // Handle success wrapper
      const processedData = responseData && responseData.status === 'success' && responseData.data 
        ? responseData.data 
        : responseData;

      let moduleNames: string[] = [];

      // Handle different response formats
      if (Array.isArray(processedData)) {
        moduleNames = processedData;
      } else if (processedData && Array.isArray(processedData)) {
        moduleNames = processedData;
      }

      console.log("📋 Extracted module names:", moduleNames);

      const screenOptions = moduleNames.map((name: string) => ({
        value: name,
        label: this.formatDisplayName(name)
      }));

      console.log("🎯 Final screen options:", screenOptions);
      return screenOptions;

    } catch (error) {
      console.error("❌ Failed to load module names:", error);
      return [];
    }
  }

  async getSectionsByModule(moduleName: string): Promise<string[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/modules/${encodeURIComponent(moduleName)}/sections`);
      console.log(`📁 Sections for ${moduleName}:`, response);
      
      // Extract data properly
      const responseData = response?.data || response;
      
      // Handle success wrapper
      const processedData = responseData && responseData.status === 'success' && responseData.data 
        ? responseData.data 
        : responseData;

      let sections: string[] = [];
      if (Array.isArray(processedData)) {
        sections = processedData;
      } else if (processedData && Array.isArray(processedData)) {
        sections = processedData;
      }
      
      return sections;
    } catch (error) {
      console.error(`Failed to load sections for module ${moduleName}:`, error);
      return [];
    }
  }

  async getFieldsByModuleAndSection(
    moduleName: string, 
    sectionName: string
  ): Promise<TransactionModuleField[]> {
    try {
      const response = await apiService.get(
        `${this.baseUrl}/modules/${encodeURIComponent(moduleName)}/sections/${encodeURIComponent(sectionName)}/fields`
      );
      console.log(`📄 Fields for ${moduleName}.${sectionName}:`, response);
      
      // Extract data properly
      const responseData = response?.data || response;
      
      // Handle success wrapper
      const processedData = responseData && responseData.status === 'success' && responseData.data 
        ? responseData.data 
        : responseData;

      let fields: any[] = [];
      if (Array.isArray(processedData)) {
        fields = processedData;
      } else if (processedData && Array.isArray(processedData)) {
        fields = processedData;
      }
      
      return fields.map((field: any, index: number) => ({
        name: field.fieldName || field.name || `field_${index}`,
        label: field.fieldLabel || field.label || this.formatDisplayName(field.fieldName || field.name || `Field ${index}`),
        tableName: field.tableName,
        databaseColumnName: field.databaseColumnName,
        dataType: field.dataType,
        isRelation: field.isRelation || false,
        relationTableName: field.relationTableName,
        relationColumnName: field.relationColumnName,
        relationDisplayColumn: field.relationDisplayColumn,
        type: this.mapDataTypeToFieldType(field.dataType)
      }));
    } catch (error) {
      console.error(`Failed to load fields for ${moduleName}.${sectionName}:`, error);
      return [];
    }
  }

  // Helper methods (unchanged)
  private generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  private formatDisplayName(name: string): string {
    if (!name) return 'Unknown';
    return name
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private mapDataTypeToFieldType(dataType: string): string {
    if (!dataType) return 'text';
    
    const typeMap: Record<string, string> = {
      'date': 'date',
      'timestamp': 'date',
      'timestamp without time zone': 'date',
      'integer': 'number',
      'bigint': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'float': 'number',
      'double precision': 'number',
      'varchar': 'text',
      'character varying': 'text',
      'text': 'textarea',
      'boolean': 'checkbox',
      'bool': 'checkbox'
    };
    return typeMap[dataType.toLowerCase()] || 'text';
  }

  // For backward compatibility
  async getModulesAsScreenOptions() {
    return this.getAllModuleNames();
  }

  async getModuleStructure() {
    const modules = await this.loadModules();
    const sectionOptions: Record<string, string[]> = {};
    const fieldOptions: Record<string, Record<string, string[]>> = {};

    modules.forEach((module) => {
      sectionOptions[module.name] = module.sections.map((s) => s.name);
      fieldOptions[module.name] = {};

      module.sections.forEach((section) => {
        fieldOptions[module.name][section.name] = section.fields.map((f) => f.name);
      });
    });

    return {
      sectionOptions,
      fieldOptions,
    };
  }

  // New method to test database schema
  async testDatabaseSchema(): Promise<any> {
    try {
      console.log("🔍 Testing database schema connection...");
      const response = await apiService.get(`${this.baseUrl}/database-schema`);
      console.log("📦 Database schema response:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch database schema:", error);
      return null;
    }
  }
}

export const TransactionModuleService = new TransactionModuleServiceClass();