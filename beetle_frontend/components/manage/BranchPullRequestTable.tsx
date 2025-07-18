import React, { useState } from 'react';
import { GitPullRequest, Clock, User, Tag, Link, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PullRequest } from './contribution-data';

interface BranchPullRequestTableProps {
  pullRequests: PullRequest[];
  branch: string;
}

const getStatus = (pr: any) => {
  if (pr.draft) return 'draft';
  if (pr.merged) return 'merged';
  if (pr.state === 'closed') return 'closed';
  if (pr.requested_reviewers?.length > 0) return 'under_review';
  return pr.state || 'open';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-green-100 text-green-800 border-green-200';
    case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'merged': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'draft': return 'bg-gray-200 text-gray-800 border-gray-300';
    case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const BranchPullRequestTable = ({ pullRequests, branch }: BranchPullRequestTableProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (pullRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <GitPullRequest size={48} className="mb-4" />
        <p>No pull requests found for {branch} branch</p>
      </div>
    );
  }

  return (
    <div className="p-4 w-full max-w-6xl mx-auto">
      <Table className="w-full text-base">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-2/5">Pull Request</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pullRequests.map((pr) => {
            const isOpen = expanded === pr.id;
            const status = pr.status || getStatus(pr);
            return (
              <React.Fragment key={pr.id}>
                <TableRow className="hover:bg-muted/40 border-b border-muted-foreground/10 transition-all group">
                  <TableCell className="align-top">
                    <button
                      className={`rounded-full p-2 bg-muted-foreground/10 hover:bg-primary/20 transition-colors flex items-center justify-center text-primary text-lg`}
                      style={{ minWidth: 40, minHeight: 40 }}
                      onClick={() => setExpanded(isOpen ? null : pr.id)}
                      aria-label={isOpen ? 'Collapse details' : 'Expand details'}
                    >
                      {isOpen ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </button>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-start gap-2">
                      <GitPullRequest size={20} className="text-blue-500 mt-1" />
                      <div>
                        <div className="font-semibold text-lg leading-tight break-words max-w-xl">{pr.title}</div>
                        <div className="text-xs text-muted-foreground">#{pr.id} • {pr.sourceBranch} → {pr.targetBranch}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge className={getStatusColor(status) + ' px-4 py-2 text-base rounded-lg font-semibold'}>{status.replace('_', ' ').replace('draft', 'Draft')}</Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-base">{pr.author ? pr.author.slice(0, 2).toUpperCase() : ''}</AvatarFallback>
                      </Avatar>
                      <span className="text-base font-medium">{pr.author}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-2 text-base text-muted-foreground">
                      <Clock size={16} />
                      {new Date(pr.lastUpdated).toLocaleDateString()}
                    </div>
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={5} className="p-4">
                      <div className="flex flex-wrap gap-8">
                        <div>
                          <div className="font-semibold mb-1">Reviewers</div>
                          <div className="flex -space-x-2">
                            {pr.reviewers.map((reviewer, idx) => (
                              <Avatar key={idx} className="h-7 w-7 border-2 border-background">
                                <AvatarFallback className="text-xs">{reviewer.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold mb-1">Labels</div>
                          <div className="flex flex-wrap gap-2">
                            {pr.labels.map((label, idx) => (
                              <Badge key={idx} variant="secondary" className="text-sm px-3 py-1 rounded-lg">{label}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold mb-1">Linked Issue</div>
                          {pr.linkedIssue ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Link size={14} />
                              #{pr.linkedIssue}
                            </div>
                          ) : '--'}
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <div className="font-semibold mb-1">Description</div>
                          <div className="text-sm text-muted-foreground break-words whitespace-pre-line">{pr.description}</div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default BranchPullRequestTable;
