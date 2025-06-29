# Data Alchemist - AI Resource Allocation Configurator

Transform messy spreadsheets into clean, validated data with AI-powered processing and intelligent rule generation.

## 🚀 Features

### Core Functionality

-   **Multi-format Data Ingestion**: Upload CSV or XLSX files for clients, workers, and tasks
-   **Intelligent Data Parsing**: AI-powered header mapping handles non-standard column names
-   **Real-time Validation**: 12+ validation rules with immediate feedback
-   **Inline Editing**: Edit data directly in the interface with live validation
-   **Business Rule Builder**: Create complex allocation rules using intuitive UI or natural language
-   **Priority Configuration**: Set weights and priorities for allocation criteria
-   **Export Ready Data**: Download cleaned data and complete rule configurations

### AI-Powered Features

-   **Natural Language Queries**: Search data using plain English
-   **Smart Header Mapping**: Automatically maps misnamed or rearranged columns
-   **Rule Conversion**: Convert natural language descriptions to structured rules
-   **Data Validation**: Enhanced AI validation beyond basic checks
-   **Correction Suggestions**: AI-powered suggestions for data fixes
-   **Rule Recommendations**: Intelligent rule suggestions based on data patterns

## 🛠️ Tech Stack

-   **Framework**: Next.js 13 with TypeScript
-   **UI Components**: shadcn/ui with Tailwind CSS
-   **AI Integration**: Google Gemini AI
-   **Data Processing**: Papa Parse (CSV) + SheetJS (XLSX)
-   **State Management**: React Context + useReducer
-   **Icons**: Lucide React

## 📋 Prerequisites

-   Node.js 18+
-   npm or yarn
-   Gemini API key (optional, for AI features)

## 🚀 Quick Start

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd data-alchemist
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Start development server**

    ```bash
    npm run dev
    ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Gemini AI Setup (Optional)

To enable AI features, you'll need a Gemini API key:

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. In the application, navigate to the Upload tab
3. Enter your API key in the "AI Enhancement" section
4. Click "Enable AI" to activate intelligent features

## 📊 Data Format

The application expects three types of data files:

### Clients (`clients.csv`)

```csv
ClientID,ClientName,PriorityLevel,RequestedTaskIDs,GroupTag,AttributesJSON
C001,Acme Corp,5,"T001,T002",enterprise,"{""budget"": 50000}"
```

### Workers (`workers.csv`)

```csv
WorkerID,WorkerName,Skills,AvailableSlots,MaxLoadPerPhase,WorkerGroup,QualificationLevel
W001,Alice Johnson,"Python,AI","[1,2,3]",3,AI Team,5
```

### Tasks (`tasks.csv`)

```csv
TaskID,TaskName,Category,Duration,RequiredSkills,PreferredPhases,MaxConcurrent
T001,AI Development,Development,3,"Python,AI","[1,2,3]",2
```

## 🎯 Usage Guide

### 1. Data Upload

-   Navigate to the **Upload** tab
-   Optionally enter your Gemini API key for AI features
-   Drag and drop or select your CSV/XLSX files
-   The system will automatically detect entity types and map headers

### 2. Data Review & Editing

-   Switch to the **Data & AI** tab
-   Use natural language queries to search your data
-   Edit data inline by clicking on any cell
-   View validation errors highlighted in red

### 3. Validation

-   Go to the **Validation** tab
-   Run comprehensive validation checks
-   Use AI-enhanced validation for deeper insights
-   Review and fix errors before proceeding

### 4. Rule Creation

-   Access the **Rules** tab
-   Use the visual rule builder or natural language converter
-   Create business rules like co-run constraints, load limits, etc.
-   Get AI-powered rule recommendations

### 5. Priority Configuration

-   Visit the **Priorities** tab
-   Adjust weights using sliders or preset profiles
-   Balance criteria like priority level, fairness, efficiency
-   Preview impact analysis

### 6. Export

-   Navigate to the **Export** tab
-   Ensure all critical errors are resolved
-   Download cleaned data (XLSX) and rules configuration (JSON)

## 🔍 Validation Rules

The system includes comprehensive validation:

### Core Validations

-   ✅ Missing required columns
-   ✅ Duplicate IDs
-   ✅ Malformed lists and arrays
-   ✅ Out-of-range values
-   ✅ Broken JSON format
-   ✅ Unknown references
-   ✅ Circular dependencies
-   ✅ Overloaded workers
-   ✅ Phase slot saturation
-   ✅ Skill coverage matrix
-   ✅ Max concurrency feasibility
-   ✅ Conflicting rules

### AI-Enhanced Validations

-   Business logic violations
-   Capacity mismatches
-   Skill gap analysis
-   Timeline conflicts
-   Data pattern anomalies

## 🤖 AI Features

### Natural Language Queries

```
"Show me all high priority clients"
"Find workers with AI skills available in phase 2"
"Tasks with duration more than 2 phases"
```

### Rule Conversion

```
"Tasks T001 and T002 must always run together"
→ Co-run rule with tasks: ["T001", "T002"]

"Limit development team to max 3 slots per phase"
→ Load limit rule for development group
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── data-grid.tsx     # Data display and editing
│   ├── file-upload.tsx   # File upload interface
│   ├── validation-panel.tsx # Validation interface
│   ├── rule-builder.tsx  # Rule creation interface
│   ├── prioritization-panel.tsx # Priority configuration
│   ├── natural-language-query.tsx # AI search
│   └── export-panel.tsx  # Export functionality
├── lib/                  # Utility libraries
│   ├── data-context.tsx  # State management
│   ├── data-parser.ts    # File parsing logic
│   ├── validation-engine.ts # Validation rules
│   ├── gemini-ai.ts      # AI integration
│   └── utils.ts          # Helper functions
├── samples/              # Sample data files
│   ├── clients.csv
│   ├── workers.csv
│   └── tasks.csv
└── README.md
```

## 🧪 Sample Data

Sample data files are included in the `/samples` directory:

-   `clients.csv` - 10 sample clients with various priorities
-   `workers.csv` - 15 sample workers with different skills
-   `tasks.csv` - 24 sample tasks across multiple categories

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm run build
# Upload the `out` directory to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the validation panel for data errors
2. Ensure your CSV/XLSX files match the expected format
3. Verify your Gemini API key is valid (for AI features)
4. Review the browser console for detailed error messages

## 🎯 Roadmap

-   [ ] Advanced rule templates
-   [ ] Bulk data operations
-   [ ] Integration with external allocation systems
-   [ ] Advanced analytics and reporting
-   [ ] Multi-language support
-   [ ] Real-time collaboration features

---

Built with ❤️ for solving spreadsheet chaos and enabling intelligent resource allocation.
