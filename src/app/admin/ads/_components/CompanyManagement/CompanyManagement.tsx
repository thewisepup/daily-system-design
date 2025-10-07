"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { CreateCompany } from "./CreateCompany";
import { UpdateCompany } from "./UpdateCompany";

export default function CompanyManagement() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Company Management</h1>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Company</TabsTrigger>
          <TabsTrigger value="update">Update Company</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <CreateCompany />
        </TabsContent>

        <TabsContent value="update" className="mt-6">
          <UpdateCompany />
        </TabsContent>
      </Tabs>
    </div>
  );
}
