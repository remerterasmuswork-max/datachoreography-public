import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Setup from "./Setup";

import Onboarding from "./Onboarding";

import Connections from "./Connections";

import Workflows from "./Workflows";

import Approvals from "./Approvals";

import Runs from "./Runs";

import Analytics from "./Analytics";

import Billing from "./Billing";

import Settings from "./Settings";

import WorkflowRunner from "./WorkflowRunner";

import OAuthHelper from "./OAuthHelper";

import SeedDemo from "./SeedDemo";

import Optimize from "./Optimize";

import Compliance from "./Compliance";

import Risk from "./Risk";

import SecuritySelfTest from "./SecuritySelfTest";

import VaultTester from "./VaultTester";

import BrainHome from "./BrainHome";

import RunConsole from "./RunConsole";

import AgentSkills from "./AgentSkills";

import BuildPlan from "./BuildPlan";

import LaunchChecklist from "./LaunchChecklist";

import BackendMigrationGuide from "./BackendMigrationGuide";

import BackendAPIContract from "./BackendAPIContract";

import BackendSetupGuide from "./BackendSetupGuide";

import BackendCode_package_json from "./BackendCode_package_json";

import BackendCode_tsconfig_json from "./BackendCode_tsconfig_json";

import BackendCode_env_example from "./BackendCode_env_example";

import BackendCode_drizzle_config from "./BackendCode_drizzle_config";

import BackendCode_src_index_ts from "./BackendCode_src_index_ts";

import BackendCode_src_db_ts from "./BackendCode_src_db_ts";

import BackendCode_src_schema_ts from "./BackendCode_src_schema_ts";

import BackendCode_migration_0000_init_sql from "./BackendCode_migration_0000_init_sql";

import BackendCode_INDEX from "./BackendCode_INDEX";

import BackendCode_src_security_keys_ts from "./BackendCode_src_security_keys_ts";

import BackendCode_src_security_jwt_ts from "./BackendCode_src_security_jwt_ts";

import BackendCode_src_security_hash_ts from "./BackendCode_src_security_hash_ts";

import BackendCode_src_middleware_auth_ts from "./BackendCode_src_middleware_auth_ts";

import BackendCode_src_middleware_rls_ts from "./BackendCode_src_middleware_rls_ts";

import BackendCode_src_routes_auth_ts from "./BackendCode_src_routes_auth_ts";

import BackendCode_src_routes_tenants_ts from "./BackendCode_src_routes_tenants_ts";

import BackendCode_src_routes_workflows_ts from "./BackendCode_src_routes_workflows_ts";

import BackendCode_src_lib_idempotency_ts from "./BackendCode_src_lib_idempotency_ts";

import BackendCode_src_lib_locks_ts from "./BackendCode_src_lib_locks_ts";

import BackendCode_src_routes_credentials_ts from "./BackendCode_src_routes_credentials_ts";

import BackendCode_src_modules_vault_index_ts from "./BackendCode_src_modules_vault_index_ts";

import BackendCode_src_routes_compliance_ts from "./BackendCode_src_routes_compliance_ts";

import BackendCode_scripts_migrate_ts from "./BackendCode_scripts_migrate_ts";

import BackendCode_scripts_seed_ts from "./BackendCode_scripts_seed_ts";

import BackendCode_docker_compose_yml from "./BackendCode_docker_compose_yml";

import BackendCode_Dockerfile from "./BackendCode_Dockerfile";

import BackendCode_README_md from "./BackendCode_README_md";

import BackendCode_gitignore from "./BackendCode_gitignore";

import BackendCode_github_workflows_ci_yml from "./BackendCode_github_workflows_ci_yml";

import AutomationHome from "./AutomationHome";

import WorkflowLibrary from "./WorkflowLibrary";

import WorkflowComposer from "./WorkflowComposer";

import ActionCenter from "./ActionCenter";

import AgentHub from "./AgentHub";

import Marketplace from "./Marketplace";

import PublisherConsole from "./PublisherConsole";

import Insights from "./Insights";

import MarketplaceSelfTest from "./MarketplaceSelfTest";

import GoNoGo from "./GoNoGo";

import BackendCode_src_schema_extended_ts from "./BackendCode_src_schema_extended_ts";

import BackendCode_src_routes_marketplace_ts from "./BackendCode_src_routes_marketplace_ts";

import BackendCode_src_routes_publisher_ts from "./BackendCode_src_routes_publisher_ts";

import BackendCode_src_routes_metrics_ts from "./BackendCode_src_routes_metrics_ts";

import BackendCode_src_routes_gdpr_ts from "./BackendCode_src_routes_gdpr_ts";

import BackendCode_src_index_updated_ts from "./BackendCode_src_index_updated_ts";

import BackendCode_src_routes_approvals_ts from "./BackendCode_src_routes_approvals_ts";

import DeveloperHandoff from "./DeveloperHandoff";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Setup: Setup,
    
    Onboarding: Onboarding,
    
    Connections: Connections,
    
    Workflows: Workflows,
    
    Approvals: Approvals,
    
    Runs: Runs,
    
    Analytics: Analytics,
    
    Billing: Billing,
    
    Settings: Settings,
    
    WorkflowRunner: WorkflowRunner,
    
    OAuthHelper: OAuthHelper,
    
    SeedDemo: SeedDemo,
    
    Optimize: Optimize,
    
    Compliance: Compliance,
    
    Risk: Risk,
    
    SecuritySelfTest: SecuritySelfTest,
    
    VaultTester: VaultTester,
    
    BrainHome: BrainHome,
    
    RunConsole: RunConsole,
    
    AgentSkills: AgentSkills,
    
    BuildPlan: BuildPlan,
    
    LaunchChecklist: LaunchChecklist,
    
    BackendMigrationGuide: BackendMigrationGuide,
    
    BackendAPIContract: BackendAPIContract,
    
    BackendSetupGuide: BackendSetupGuide,
    
    BackendCode_package_json: BackendCode_package_json,
    
    BackendCode_tsconfig_json: BackendCode_tsconfig_json,
    
    BackendCode_env_example: BackendCode_env_example,
    
    BackendCode_drizzle_config: BackendCode_drizzle_config,
    
    BackendCode_src_index_ts: BackendCode_src_index_ts,
    
    BackendCode_src_db_ts: BackendCode_src_db_ts,
    
    BackendCode_src_schema_ts: BackendCode_src_schema_ts,
    
    BackendCode_migration_0000_init_sql: BackendCode_migration_0000_init_sql,
    
    BackendCode_INDEX: BackendCode_INDEX,
    
    BackendCode_src_security_keys_ts: BackendCode_src_security_keys_ts,
    
    BackendCode_src_security_jwt_ts: BackendCode_src_security_jwt_ts,
    
    BackendCode_src_security_hash_ts: BackendCode_src_security_hash_ts,
    
    BackendCode_src_middleware_auth_ts: BackendCode_src_middleware_auth_ts,
    
    BackendCode_src_middleware_rls_ts: BackendCode_src_middleware_rls_ts,
    
    BackendCode_src_routes_auth_ts: BackendCode_src_routes_auth_ts,
    
    BackendCode_src_routes_tenants_ts: BackendCode_src_routes_tenants_ts,
    
    BackendCode_src_routes_workflows_ts: BackendCode_src_routes_workflows_ts,
    
    BackendCode_src_lib_idempotency_ts: BackendCode_src_lib_idempotency_ts,
    
    BackendCode_src_lib_locks_ts: BackendCode_src_lib_locks_ts,
    
    BackendCode_src_routes_credentials_ts: BackendCode_src_routes_credentials_ts,
    
    BackendCode_src_modules_vault_index_ts: BackendCode_src_modules_vault_index_ts,
    
    BackendCode_src_routes_compliance_ts: BackendCode_src_routes_compliance_ts,
    
    BackendCode_scripts_migrate_ts: BackendCode_scripts_migrate_ts,
    
    BackendCode_scripts_seed_ts: BackendCode_scripts_seed_ts,
    
    BackendCode_docker_compose_yml: BackendCode_docker_compose_yml,
    
    BackendCode_Dockerfile: BackendCode_Dockerfile,
    
    BackendCode_README_md: BackendCode_README_md,
    
    BackendCode_gitignore: BackendCode_gitignore,
    
    BackendCode_github_workflows_ci_yml: BackendCode_github_workflows_ci_yml,
    
    AutomationHome: AutomationHome,
    
    WorkflowLibrary: WorkflowLibrary,
    
    WorkflowComposer: WorkflowComposer,
    
    ActionCenter: ActionCenter,
    
    AgentHub: AgentHub,
    
    Marketplace: Marketplace,
    
    PublisherConsole: PublisherConsole,
    
    Insights: Insights,
    
    MarketplaceSelfTest: MarketplaceSelfTest,
    
    GoNoGo: GoNoGo,
    
    BackendCode_src_schema_extended_ts: BackendCode_src_schema_extended_ts,
    
    BackendCode_src_routes_marketplace_ts: BackendCode_src_routes_marketplace_ts,
    
    BackendCode_src_routes_publisher_ts: BackendCode_src_routes_publisher_ts,
    
    BackendCode_src_routes_metrics_ts: BackendCode_src_routes_metrics_ts,
    
    BackendCode_src_routes_gdpr_ts: BackendCode_src_routes_gdpr_ts,
    
    BackendCode_src_index_updated_ts: BackendCode_src_index_updated_ts,
    
    BackendCode_src_routes_approvals_ts: BackendCode_src_routes_approvals_ts,
    
    DeveloperHandoff: DeveloperHandoff,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Setup" element={<Setup />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/Connections" element={<Connections />} />
                
                <Route path="/Workflows" element={<Workflows />} />
                
                <Route path="/Approvals" element={<Approvals />} />
                
                <Route path="/Runs" element={<Runs />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Billing" element={<Billing />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/WorkflowRunner" element={<WorkflowRunner />} />
                
                <Route path="/OAuthHelper" element={<OAuthHelper />} />
                
                <Route path="/SeedDemo" element={<SeedDemo />} />
                
                <Route path="/Optimize" element={<Optimize />} />
                
                <Route path="/Compliance" element={<Compliance />} />
                
                <Route path="/Risk" element={<Risk />} />
                
                <Route path="/SecuritySelfTest" element={<SecuritySelfTest />} />
                
                <Route path="/VaultTester" element={<VaultTester />} />
                
                <Route path="/BrainHome" element={<BrainHome />} />
                
                <Route path="/RunConsole" element={<RunConsole />} />
                
                <Route path="/AgentSkills" element={<AgentSkills />} />
                
                <Route path="/BuildPlan" element={<BuildPlan />} />
                
                <Route path="/LaunchChecklist" element={<LaunchChecklist />} />
                
                <Route path="/BackendMigrationGuide" element={<BackendMigrationGuide />} />
                
                <Route path="/BackendAPIContract" element={<BackendAPIContract />} />
                
                <Route path="/BackendSetupGuide" element={<BackendSetupGuide />} />
                
                <Route path="/BackendCode_package_json" element={<BackendCode_package_json />} />
                
                <Route path="/BackendCode_tsconfig_json" element={<BackendCode_tsconfig_json />} />
                
                <Route path="/BackendCode_env_example" element={<BackendCode_env_example />} />
                
                <Route path="/BackendCode_drizzle_config" element={<BackendCode_drizzle_config />} />
                
                <Route path="/BackendCode_src_index_ts" element={<BackendCode_src_index_ts />} />
                
                <Route path="/BackendCode_src_db_ts" element={<BackendCode_src_db_ts />} />
                
                <Route path="/BackendCode_src_schema_ts" element={<BackendCode_src_schema_ts />} />
                
                <Route path="/BackendCode_migration_0000_init_sql" element={<BackendCode_migration_0000_init_sql />} />
                
                <Route path="/BackendCode_INDEX" element={<BackendCode_INDEX />} />
                
                <Route path="/BackendCode_src_security_keys_ts" element={<BackendCode_src_security_keys_ts />} />
                
                <Route path="/BackendCode_src_security_jwt_ts" element={<BackendCode_src_security_jwt_ts />} />
                
                <Route path="/BackendCode_src_security_hash_ts" element={<BackendCode_src_security_hash_ts />} />
                
                <Route path="/BackendCode_src_middleware_auth_ts" element={<BackendCode_src_middleware_auth_ts />} />
                
                <Route path="/BackendCode_src_middleware_rls_ts" element={<BackendCode_src_middleware_rls_ts />} />
                
                <Route path="/BackendCode_src_routes_auth_ts" element={<BackendCode_src_routes_auth_ts />} />
                
                <Route path="/BackendCode_src_routes_tenants_ts" element={<BackendCode_src_routes_tenants_ts />} />
                
                <Route path="/BackendCode_src_routes_workflows_ts" element={<BackendCode_src_routes_workflows_ts />} />
                
                <Route path="/BackendCode_src_lib_idempotency_ts" element={<BackendCode_src_lib_idempotency_ts />} />
                
                <Route path="/BackendCode_src_lib_locks_ts" element={<BackendCode_src_lib_locks_ts />} />
                
                <Route path="/BackendCode_src_routes_credentials_ts" element={<BackendCode_src_routes_credentials_ts />} />
                
                <Route path="/BackendCode_src_modules_vault_index_ts" element={<BackendCode_src_modules_vault_index_ts />} />
                
                <Route path="/BackendCode_src_routes_compliance_ts" element={<BackendCode_src_routes_compliance_ts />} />
                
                <Route path="/BackendCode_scripts_migrate_ts" element={<BackendCode_scripts_migrate_ts />} />
                
                <Route path="/BackendCode_scripts_seed_ts" element={<BackendCode_scripts_seed_ts />} />
                
                <Route path="/BackendCode_docker_compose_yml" element={<BackendCode_docker_compose_yml />} />
                
                <Route path="/BackendCode_Dockerfile" element={<BackendCode_Dockerfile />} />
                
                <Route path="/BackendCode_README_md" element={<BackendCode_README_md />} />
                
                <Route path="/BackendCode_gitignore" element={<BackendCode_gitignore />} />
                
                <Route path="/BackendCode_github_workflows_ci_yml" element={<BackendCode_github_workflows_ci_yml />} />
                
                <Route path="/AutomationHome" element={<AutomationHome />} />
                
                <Route path="/WorkflowLibrary" element={<WorkflowLibrary />} />
                
                <Route path="/WorkflowComposer" element={<WorkflowComposer />} />
                
                <Route path="/ActionCenter" element={<ActionCenter />} />
                
                <Route path="/AgentHub" element={<AgentHub />} />
                
                <Route path="/Marketplace" element={<Marketplace />} />
                
                <Route path="/PublisherConsole" element={<PublisherConsole />} />
                
                <Route path="/Insights" element={<Insights />} />
                
                <Route path="/MarketplaceSelfTest" element={<MarketplaceSelfTest />} />
                
                <Route path="/GoNoGo" element={<GoNoGo />} />
                
                <Route path="/BackendCode_src_schema_extended_ts" element={<BackendCode_src_schema_extended_ts />} />
                
                <Route path="/BackendCode_src_routes_marketplace_ts" element={<BackendCode_src_routes_marketplace_ts />} />
                
                <Route path="/BackendCode_src_routes_publisher_ts" element={<BackendCode_src_routes_publisher_ts />} />
                
                <Route path="/BackendCode_src_routes_metrics_ts" element={<BackendCode_src_routes_metrics_ts />} />
                
                <Route path="/BackendCode_src_routes_gdpr_ts" element={<BackendCode_src_routes_gdpr_ts />} />
                
                <Route path="/BackendCode_src_index_updated_ts" element={<BackendCode_src_index_updated_ts />} />
                
                <Route path="/BackendCode_src_routes_approvals_ts" element={<BackendCode_src_routes_approvals_ts />} />
                
                <Route path="/DeveloperHandoff" element={<DeveloperHandoff />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}